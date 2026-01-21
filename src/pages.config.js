import Admin from './pages/Admin';
import Assignments from './pages/Assignments';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import PetCreator from './pages/PetCreator';
import Rewards from './pages/Rewards';
import Season from './pages/Season';
import UserSettings from './pages/UserSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Assignments": Assignments,
    "Dashboard": Dashboard,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "PetCreator": PetCreator,
    "Rewards": Rewards,
    "Season": Season,
    "UserSettings": UserSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};