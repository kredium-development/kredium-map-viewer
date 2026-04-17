export default class Route {
    constructor(route, method) {
        this.route = route;
        this.method = method;
        this.params = {};
    }

    param(key, value) {
        this.params[key] = value !== undefined ? value : '';
        return this;
    }

    render() {
        let routeClean = this.route;

        // replace params in route
        // i.e. delete/{id}, {id:1} will produce delete/1
        Object.keys(this.params).forEach(k => {
            routeClean = routeClean.replace(`/{${k}}`, this.params[k] ? `/${this.params[k].toString()}` : '')
        });

        return routeClean;
    }
}
