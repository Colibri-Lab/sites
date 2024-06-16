App.Modules.Sites.ModulesManagerList = class extends Colibri.UI.List {
    
    

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-module-list-component');
        this._modulesList = [];
        this._names = new Map();
        this.removeHiddenNodes = true;

        this.idField = 'name';
        this.AddClass('-has-search');
        this.rendererComponent = 'App.Modules.Sites.ModulesManagerListItem';

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

        if(Object.isObject(data)) {
            data = Object.values(data);
        }

        this._group.value = data;

    }
    
}