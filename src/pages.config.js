import Home from './pages/Home';
import Predictions from './pages/Predictions';
import PredictionDetail from './pages/PredictionDetail';
import Tasks from './pages/Tasks';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import CreatePrediction from './pages/CreatePrediction';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Predictions": Predictions,
    "PredictionDetail": PredictionDetail,
    "Tasks": Tasks,
    "Leaderboard": Leaderboard,
    "Profile": Profile,
    "CreatePrediction": CreatePrediction,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};