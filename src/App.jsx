import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
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
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedTopic = localStorage.getItem("selectedTopic");

    if (savedUser) {
      setName(savedUser.name);
      setRrn(savedUser.rrn);
      setLoggedIn(true);
      fetchSelectedTopic(savedUser.rrn);
      fetchTopics();
    }

    if (savedTopic) {
      setSelectedTopic(savedTopic);
    }
  }, []);

  const fetchTopics = async () => {
    try {
      const topicsSnapshot = await getDocs(collection(db, "topics"));
      let fetchedTopics = topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const removedSnapshot = await getDocs(collection(db, "removedTopics"));
      const removedTopics = removedSnapshot.docs.map((doc) => doc.data().topicName);

      fetchedTopics = fetchedTopics.filter((topic) => !removedTopics.includes(topic.topicName));
      setTopics(fetchedTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchSelectedTopic = async (rrn) => {
    try {
      const selectedRef = collection(db, "selectedTopics");
      const q = query(selectedRef, where("rrn", "==", rrn));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const selectedData = querySnapshot.docs[0].data();
        setSelectedTopic(selectedData.selectedTopic);
        localStorage.setItem("selectedTopic", selectedData.selectedTopic);
      } else {
        setSelectedTopic(null);
        localStorage.removeItem("selectedTopic");
      }
    } catch (error) {
      console.error("Error fetching selected topic:", error);
    }
  };

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
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedTopic");
    setName("");
    setRrn("");
    setSelectedTopic(null);
    setLoggedIn(false);
  };

  const selectTopic = async (topicName) => {
    try {
      if (!topicName) {
        console.error("Invalid topic name:", topicName);
        alert("Error: Topic name is not valid.");
        return;
      }

      await addDoc(collection(db, "selectedTopics"), {
        name,
        rrn,
        selectedTopic: topicName,
        timestamp: new Date(),
      });

      await addDoc(collection(db, "removedTopics"), {
        topicName,
        timestamp: new Date(),
      });

      localStorage.setItem("selectedTopic", topicName);

      alert("Topic selected successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error selecting topic:", error);
      alert("An error occurred while selecting the topic. Please try again.");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="container mt-5 flex-grow-1">
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

            {selectedTopic ? (
              <div className="card p-3 mb-3 bg-dark text-white">
                <h5>Selected Topic:</h5>
                <p className="mb-0 fw-bold">{selectedTopic}</p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="overflow-auto" style={{ maxHeight: "500px" }}>
                  {topics
                    .sort((a, b) => a.topicName.localeCompare(b.topicName))
                    .filter((topic) =>
                      topic.topicName.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((topic, index) => (
                      <div
                        key={topic.id}
                        className="card mb-2 p-3 d-flex flex-row align-items-center"
                      >
                        <span className="fw-bold me-3">{index + 1}.</span>
                        <span className="flex-grow-1">{topic.topicName}</span>
                        <button
                          className="btn btn-success"
                          onClick={() => selectTopic(topic.topicName)}
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

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 fixed-bottom">
  <p className="mb-0">© 2025 <a href='https://www.instagram.com/md___.sameer.___.off/'>Mohamed Sameer</a>. All rights reserved.</p>
</footer>

    </div>
  );
};

export default MaterialSelectionPortal;
