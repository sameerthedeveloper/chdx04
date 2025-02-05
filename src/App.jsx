import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

const firebaseConfig = {
  apiKey: "AIzaSyAwrafiLbVfkfnmukvVXzEpvq_GjAEiF1Q",
  authDomain: "personalprojects-4ea96.firebaseapp.com",
  projectId: "personalprojects-4ea96",
  storageBucket: "personalprojects-4ea96.firebasestorage.app",
  messagingSenderId: "122755752924",
  appId: "1:122755752924:web:ec4cbbccbdde69938ba519",
  measurementId: "G-WZQ4QM5P0T"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MaterialSelectionPortal = () => {
  const [name, setName] = useState("");
  const [rrn, setRrn] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null); // State to track the selected topic

  // Load saved user & selected topic from localStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedTopic = localStorage.getItem("selectedTopic");

    if (savedUser) {
      setName(savedUser.name);
      setRrn(savedUser.rrn);
      setLoggedIn(true);
    }
    if (savedTopic) {
      setSelectedTopic(savedTopic);
    }
  }, []);

  const fetchTopics = async () => {
    try {
      // Get all topics
      const topicsSnapshot = await getDocs(collection(db, "topics"));
      let fetchedTopics = topicsSnapshot.docs.map((doc) => ({
        id: Number(doc.id),
        ...doc.data(),
      }));
  
      // Get all removed topics
      const removedSnapshot = await getDocs(collection(db, "removedTopics"));
      const removedTopics = removedSnapshot.docs.map((doc) => doc.data().topicName);
  
      // Filter out removed topics
      fetchedTopics = fetchedTopics.filter((topic) => !removedTopics.includes(topic.topicName));
  
      setTopics(fetchedTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };
  

  useEffect(() => {
    if (loggedIn) {
      fetchTopics();
    }
  }, [loggedIn]);
  
  const handleLogin = async () => {
    if (name && rrn) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("rrn", "==", rrn));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(usersRef, { name, rrn });
      }

      localStorage.setItem("user", JSON.stringify({ name, rrn }));
      setLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedTopic"); // Clear selected topic on logout
    setName("");
    setRrn("");
    setSelectedTopic(null);
    setLoggedIn(false);
  };

  const selectTopic = async (topicId, topicName) => {
    try {
      // Reference to `removedTopics` collection
      const removedTopicsRef = collection(db, "removedTopics");
  
      // Check if the topic already exists in `removedTopics`
      const q = query(removedTopicsRef, where("topicName", "==", topicName));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        alert("This topic has already been selected and moved to 'Removed Topics'.");
        return;
      }
  
      // Add selected topic to 'selectedTopics' collection
      await addDoc(collection(db, "selectedTopics"), {
        name,
        rrn,
        selectedTopic: topicName,
        timestamp: new Date(),
      });
  
      // Move the topic to 'removedTopics' table
      await addDoc(removedTopicsRef, {
        topicId,
        topicName,
        timestamp: new Date(),
      });
  
      // Delete the topic from 'topics' collection
      const topicDocRef = doc(db, "topics", topicId);
      await deleteDoc(topicDocRef);
  
      // Save selected topic to localStorage
      localStorage.setItem("selectedTopic", topicName);
      
      // Refresh the page to show the selected topic card
      window.location.reload();  
  
    } catch (error) {
      console.error("Error selecting topic:", error);
      alert("Successfully Selected");
    }
  };
  

  return (
    <div className="container mt-5">
      {!loggedIn ? (
        <div className="card p-4">
          <h3>Login</h3>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Enter RRN"
            value={rrn}
            onChange={(e) => setRrn(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleLogin}>
            Login
          </button>
        </div>
      ) : (
        <div>
            <h3 className="h3">CHDX04 - Functional Materials and Application</h3>
          <hr />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Select An Assignment Topic</h3>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* Display selected topic */}
          {selectedTopic ? (
            <div className="card p-3 mb-3 bg-info text-white">
              <h5>Selected Topic:</h5>
              <p className="mb-0 fw-bold">{selectedTopic}</p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Search topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Topic List */}
              <div className="overflow-auto" style={{ maxHeight: "500px" }}>
                {topics
                  .sort((a, b) => a.id - b.id)
                  .filter((topic) => topic.topicName.toLowerCase().includes(search.toLowerCase()))
                  .map((topic, index) => (
                    <div key={topic.id} className="card mb-2 p-3 d-flex flex-row align-items-center">
                      <span className="fw-bold me-3">{index + 1}.</span>
                      <span className="flex-grow-1">{topic.topicName}</span>
                      <button
                        className="btn btn-success"
                        onClick={() => selectTopic(topic.id, topic.topicName)}
                      >
                        Select
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialSelectionPortal;
