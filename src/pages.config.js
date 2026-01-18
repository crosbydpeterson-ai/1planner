import Admin from './pages/Admin';
import Assignments from './pages/Assignments';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Season from './pages/Season';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Assignments": Assignments,
    "Dashboard": Dashboard,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Rewards": Rewards,
    "Season": Season,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};