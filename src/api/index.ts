import * as Products from './functions/products';
import * as Auth from './functions/auth';
import * as Bonus from './functions/bonus';
import * as Delivery from './functions/delivery';
import * as Order from "./functions/order"

class API {
    public products = Products;
    public auth = Auth;
    public bonus = Bonus;
    public delivery = Delivery;
    public order = Order
}

const api = new API();

export default api;