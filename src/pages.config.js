import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Assignments from './pages/Assignments';
import Leaderboard from './pages/Leaderboard';


export const PAGES = {
    "Dashboard": Dashboard,
    "Home": Home,
    "Assignments": Assignments,
    "Leaderboard": Leaderboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};