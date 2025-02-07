import {useState, useEffect} from 'react';
import {Alert, Button, StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {createStackNavigator} from "@react-navigation/stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import {NavigationContainer} from "@react-navigation/native";
import RegisterScreen from "./screens/RegisterScreen";
import LoginScreen from "./screens/LoginScreen";
import MainScreen from "./screens/MainScreen";

const Stack = createStackNavigator();

const TaskScreen = ({ navigation }) => {
    const [tasks, setTasks] = useState([]);
    const [sortOption, setSortOption] = useState("date");
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
        }
    };

    const saveTasks = async (newTasks) => {
        await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
        setTasks(newTasks);
    };

    const toggleTaskCompletion = (id) => {
        const updatedTasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks(updatedTasks);
    };

    const deleteTask = (id) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const newTasks = tasks.filter(task => task.id !== id);
                        saveTasks(newTasks);
                    }
                }
            ]
        );
    };

    const deleteAllTasks = () => {
        Alert.alert(
            'Delete All Tasks',
            'Are you sure you want to delete all tasks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('tasks');
                        setTasks([]);
                    }
                }
            ]
        );
    };

    const getSortedTasks = () => {
        let sortedTasks = [...tasks];

        if (sortOption === "status") {
            sortedTasks.sort((a, b) => a.completed - b.completed);
        } else if (sortOption === "date") {
            sortedTasks.sort((a, b) => new Date(b.id) - new Date(a.id));
        }

        return sortedTasks;
    };

    const getFilteredTasks = () => {
        const filteredTasks = getSortedTasks().filter(task =>
            task.text.toLowerCase().includes(searchKeyword.toLowerCase())
        );
        return filteredTasks;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tasks:</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                value={searchKeyword}
                onChangeText={setSearchKeyword}
            />

            <View style={styles.sortButtonsContainer}>
                <TouchableOpacity
                    style={[styles.sortButton, sortOption === "date" && styles.selectedSortButton]}
                    onPress={() => setSortOption("date")}
                >
                    <Text style={styles.sortButtonText}>Sort by Date</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sortButton, sortOption === "status" && styles.selectedSortButton]}
                    onPress={() => setSortOption("status")}
                >
                    <Text style={styles.sortButtonText}>Sort by Status</Text>
                </TouchableOpacity>
            </View>

            {tasks.length === 0 ? (
                <Text style={styles.emptyText}>List is empty</Text>
            ) : (
                <FlatList
                    data={getFilteredTasks()}
                    renderItem={({ item }) => (
                        <View style={styles.taskItemContainer}>
                            <TouchableOpacity
                                style={styles.taskItem}
                                onPress={() => toggleTaskCompletion(item.id)}
                            >
                                <Text
                                    style={[
                                        styles.taskText,
                                        item.completed && styles.completedTaskText
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.text}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteTask(item.id)}>
                                <Ionicons name="trash-bin-outline" size={24} color="#ff5c5c" />
                            </TouchableOpacity>
                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                />
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddTask', { saveTasks, tasks })}
            >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={deleteAllTasks}
            >
                <Text style={styles.deleteAllButtonText}>Delete All Tasks</Text>
            </TouchableOpacity>
        </View>
    );
};

const TaskDetailsScreen = ({route, navigation}) => {
    const {task, updateTask} = route.params;
    const [taskText, setTaskText] = useState(task.text);
    const [completed, setCompleted] = useState(task.completed);

    const saveTask = async () => {
        if (!taskText.trim()) {
            alert('Task text cannot be empty')
        }

        updateTask({...task, text: taskText, completed});
        navigation.goBack();

    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Change your task:</Text>
            <TextInput
                style={styles.input}
                value={taskText}
                onChangeText={setTaskText}
                multiline
            />
            <View style={styles.completionContainer}>
                <Text style={styles.completionText}>Completed:</Text>
                <TouchableOpacity
                    style={styles.completionButton}
                    onPress={() => setCompleted(!completed)}
                >
                    <Ionicons
                        name={completed ? "checkbox-outline" : "square-outline"}
                        size={24}
                        color="#007bff"
                    />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={saveTask}
            >
                <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
        </View>
    )
}

const AddTaskScreen = ({route, navigation}) => {
    const {saveTasks, tasks} = route.params;
    const [taskText, setTaskText] = useState('');

    const addTask = async () => {
        if (!taskText.trim()) {
            alert('Task text cannot be empty')
        }

        const newTask = {
            id: new Date().toString(),
            text: taskText,
            completed: false
        }

        saveTasks([...tasks, newTask]);
        navigation.goBack();

    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add new Task</Text>
            <TextInput
                style={styles.textArea}
                placeholder="Enter your task details here..."
                value={taskText}
                onChangeText={setTaskText}
                multiline
            />
            <TouchableOpacity
                style={styles.saveButton}
                onPress={addTask}
            >
                <Text style={styles.saveButtonText}>Save Task</Text>
            </TouchableOpacity>
        </View>
    );
}

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Register" component={RegisterScreen}/>
                <Stack.Screen name="Login" component={LoginScreen}/>
                <Stack.Screen name="Main" component={MainScreen}/>
                <Stack.Screen name="Tasks" component={TaskScreen}/>
                <Stack.Screen name="AddTask" component={AddTaskScreen}/>
                <Stack.Screen name="TaskDetails" component={TaskDetailsScreen}/>
            </Stack.Navigator>
        </NavigationContainer>

    )
}

export default App;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    taskItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
        borderBottomWidth: 1,
        borderBottomColor: "blue",
    },
    taskItem: {
        flex: 1,
        padding: 10,
    },
    taskText: {
        fontSize: 16,
    },
    completedTaskText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    addButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#007bff',
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        marginBottom: 10,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        marginBottom: 10,
        minHeight: 150,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    deleteAllButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#dc3545',
        borderRadius: 5,
        alignItems: 'center',
    },
    deleteAllButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    completionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    completionText: {
        fontSize: 16,
        marginRight: 10,
    },
    completionButton: {
        padding: 5,
    },
    sortButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    sortButton: {
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
    },
    selectedSortButton: {
        backgroundColor: '#007bff',
    },
    sortButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        marginBottom: 10,
    },
});