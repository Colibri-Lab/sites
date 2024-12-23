App.Modules.Sites.StoragesManagerList = class extends Colibri.UI.List {
    
    

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-storages-list-component');
        this.AddClass('-has-search');

        this.idField = 'name';
        this.rendererComponent = 'App.Modules.Sites.StoragesManagerListItem';

        this._group = new Colibri.UI.List.Group(this.name + '_group', this);
        this._group.shown = true;

    }

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {
        if(!data) {
            return;
        }

        const selected = this.selected?.value ?? null;
        const storagesList = Object.values(data).filter(v => v.module == this._module.name && (v?.params?.visible ?? true) === true);
        this._group.value = storagesList;

        if(selected) {
            const newSelected = this._group.FindByKey(selected.name);
            if(newSelected != null) {
                const s = this._group.Items(newSelected);
                this.SelectItem(s);            
            }
        }

    }


    /**
     * Module object
     * @type {Object}
     */
    get module() {
        return this._module;
    }
    /**
     * Module object
     * @type {Object}
     */
    set module(value) {
        this._module = value;
        this._showModule();
    }
    _showModule() {
        if(!this._module) {
            this._group.value = [];
            return;
        }

        this.binding = 'app.manage.storages';
        App.Store.AsyncQuery('app.manage.storages').then(storages => {
            const storagesList = Object.values(storages).filter(v => v.module == this._module.name && (v?.params?.visible ?? true) === true);
            this._group.value = storagesList;
        });    
    }

    /**
     * Value Array
     * @type {Array}
     */
    get value() {
        return this._value;
    }
    /**
     * Value Array
     * @type {Array}
     */
    set value(value) {
        this._value = value;
        this._showValue();
    }
    _showValue() {
        this._group.value = this._value;
    }

}