App.Modules.Sites.Widgets.StoragesWidget = class extends Colibri.UI.Widget {
    
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

    static Params() {
        return {
            defaultIndex: 5,
            name: 'storages-stats'
        }
    }
}

try{ MainFrame.RegisterWidget('storages-stats', App.Modules.Sites.Widgets.StoragesWidget); } catch(e) {}