import { Routes, Route, BrowserRouter as Router, Navigate } from 'react-router-dom';
import Signup from '../pages/Auth/Signup';
import ProtectedRoute from './protected-route';
import Login from '../pages/Auth/Login';
import Layout from '../components/chatbot/layout';
import Chats from '../components/chatbot/chatbot';
import Settings from '../components/chatbot/setting';
import UserProfile from '../pages/userprofile';
import Home from '../pages/home';
import Analytics from '../pages/Analytics/Analytics';
import RAGInterface from '../pages/Rag';

const MainRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/chats/:chatId" element={<Chats />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/user" element={<UserProfile />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/knowledge-base" element={<RAGInterface />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to={'/'} />} />

            </Routes>
        </Router>
    );
};

export default MainRoutes;
