import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Assignments from './pages/Assignments';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Season from './pages/Season';
import Admin from './pages/Admin';


export const PAGES = {
    "Dashboard": Dashboard,
    "Home": Home,
    "Assignments": Assignments,
    "Leaderboard": Leaderboard,
    "Rewards": Rewards,
    "Season": Season,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};