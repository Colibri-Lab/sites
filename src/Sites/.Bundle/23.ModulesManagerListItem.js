App.Modules.Sites.ModulesManagerListItem = class extends Colibri.UI.Pane {
    
    

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.ModulesManagerListItem']);
        this.AddClass('app-manager-module-list-item-component');
        
        this._ttl = this.Children('container/ttl2');
        this._nam = this.Children('container/nam');
        this.hasContextMenu = true;

        this.AddHandler('ContextMenuIconClicked', (event, args) => this.__thisContextMenuItemClicked(event, args));

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __thisContextMenuItemClicked(event, args) {
        this.parent.Dispatch('ContextMenuIconClicked', args);
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
        this._nam.value = this._value.name;
    }

}