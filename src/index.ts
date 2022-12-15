import 'dotenv/config';
import 'module-alias/register';
import App from './app';
import LoginController from './resources/controllers/login/loginController';
import BoardController from './resources/controllers/board/boardController';
import CardController from './resources/controllers/card/cardController';
import RaiaController from './resources/controllers/raia/raiaController';

const loginController = new LoginController();
const boardController = new BoardController();
const cardController = new CardController();
const raiaController = new RaiaController();

loginController.initialiseRoutes();
boardController.initialiseRoutes();
cardController.initialiseRoutes();
raiaController.initialiseRoutes();
const app = new App(
    [loginController, boardController, cardController, raiaController],
    Number(process.env.PORT)
);

app.start();
app.listen();
