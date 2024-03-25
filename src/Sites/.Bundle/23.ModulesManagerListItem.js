App.Modules.Sites.ModulesManagerListItem = class extends Colibri.UI.Pane {
    
    

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.ModulesManagerListItem']);
        this.AddClass('app-manager-module-list-item-component');
        
        this._ttl = this.Children('ttl2');
        this._nam = this.Children('nam');
        
    }

    /**
     * Value Object
     * @type {Object}
     */
    get value() {
        return this._value;
    }
    /**
     * Value Object
     * @type {Object}
     */
    set value(value) {
        this._value = value;
        this._showValue();
    }
    _showValue() {
        this._ttl.value = this._value.desc;
        this._nam.value = this._value.name
    }

}