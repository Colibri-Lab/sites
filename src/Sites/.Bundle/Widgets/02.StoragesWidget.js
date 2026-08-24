/**
 * @class
 * @extends Colibri.UI.Widget
 * @memberof App.Modules.Sites.Widgets
 */
App.Modules.Sites.Widgets.StoragesWidget = class extends Colibri.UI.Widget {
    
    /**
     * @constructor
     * @param {string} name - The name of the component
     * @param {Colibri.UI.Pane} container - The container of the component
     */
    constructor(name, container) {
        /* создаем компонент и передаем шаблон */
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.Widgets.StoragesWidget']);
        this.AddClass('app-modules-sites-widgets-storageswidget');

        this.title = '#{sites-widgets-storageswidget-title}';
        this.closable = false;
        this.colspan = 3;

        this.binding = 'app.sites.status';

        this._storages = this.Children('storages');
        this._storages.rows.title = '';

    }

    /**
     * Render bounded to component data
     * @protected
     * @ignore
     * @param {*} data 
     * @param {String} path
     */
    __renderBoundedValues(data, path) {
        if(!data) {
            return;
        }

        try {
            this._storages.value = data;
        }
        catch(e) {
            console.log(e);
        }

    } 

    /**
     * @static
     * @public
     */
    static Params() {
        return {
            defaultIndex: 5,
            name: 'storages-stats'
        }
    }
}

try{ MainFrame && MainFrame.RegisterWidget('storages-stats', App.Modules.Sites.Widgets.StoragesWidget); } catch(e) {}