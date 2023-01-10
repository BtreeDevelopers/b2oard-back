import 'dotenv/config';
import 'module-alias/register';
import App from './app';
import LoginController from './resources/controllers/login/loginController';
import BoardController from './resources/controllers/board/boardController';
import CardController from './resources/controllers/card/cardController';
import RaiaController from './resources/controllers/raia/raiaController';
import AceptanceController from './resources/controllers/aceptance/aceptanceController';
import FavoritesController from './resources/controllers/favorites/favoritesController';

const loginController = new LoginController();
const boardController = new BoardController();
const cardController = new CardController();
const raiaController = new RaiaController();
const aceptanceController = new AceptanceController();
const favoritesController = new FavoritesController();

loginController.initialiseRoutes();
boardController.initialiseRoutes();
cardController.initialiseRoutes();
raiaController.initialiseRoutes();
aceptanceController.initialiseRoutes();
favoritesController.initialiseRoutes();

const app = new App(
    [
        loginController,
        boardController,
        cardController,
        raiaController,
        aceptanceController,
        favoritesController,
    ],
   process.env.PORT as any
);

app.start();
app.listen();
