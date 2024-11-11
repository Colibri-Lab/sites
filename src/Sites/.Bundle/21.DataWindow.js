
App.Modules.Sites.DataWindow = class extends Colibri.UI.Window {

    constructor(name, container, title) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.DataWindow'], title);

        this.AddClass('app-data-window-component');

        this._storages = this.Children('split/storages');
        this._data = this.Children('split/data-pane/data');
        this._searchInput = this.Children('split/data-pane/search-pane/search-input');
        this._save = this.Children('save');

        this._storages.AddHandler('SelectionChanged', (event, args) => this.__storagesSelectionChanged(event, args));
        this._data.AddHandler(['SelectionChanged', 'CheckChanged'], (event, args) => this.__dataSelectionChanged(event, args));
        this._data.AddHandler('ColumnClicked', (event, args) => this.__clickOnDataColumn(event, args));        
        this._data.AddHandler('ScrolledToBottom', (event, args) => this.__dataScrolledToBottom(event, args));
        this._save.AddHandler('Clicked', (event, args) => this.__saveClicked(event, args));

        this._searchInput.AddHandler(['Filled', 'Cleared'], (event, args) => this.__searchInputFilled(event, args));

    }

    Show(publicationCallback) {

        this._publicationCallback = publicationCallback;
        this.shown = true;   

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnDataColumn(event, args) {
        this.__searchInputFilled(event, args);
    }


    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __dataScrolledToBottom(event, args) {
        const selected = this._storages.selected;
        this._loadDataPage(selected?.tag, this._searchInput.value, this._data.sortColumn?.name, this._data.sortOrder, this._dataCurrentPage + 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __searchInputFilled(event, args) {
        const selected = this._storages.selected;
        if(!selected || (selected.tag === 'module' || selected.tag === 'group')) {
            this._data.storage = null;
            this._data.ClearAll(); 
            return;           
        }
        
        this._data.storage = selected.tag;
        this._loadDataPage(selected?.tag, this._searchInput.value, this._data.sortColumn?.name, this._data.sortOrder, 1);
    }

    _loadDataPage(storage, searchTerm, sortField, sortOrder, page) {
        this._dataCurrentPage = page;
        Sites.LoadData(storage, searchTerm, {}, sortField, sortOrder, page, 20);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __storagesSelectionChanged(event, args) {
        const selection = this._storages.selected;
        if(!selection) {
            this._data.ClearAll();
            this._searchInput.enabled = false;
            this._data.enabled = false;            
            return;
        }

        this._searchInput.enabled = selection != null;
        this._data.enabled = selection != null;     
        this._data.UncheckAllRows();
        this._data.UnselectAllRows();   
        
        this.__searchInputFilled(event, args);
        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __dataSelectionChanged(event, args) {
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._save.enabled = checked.length > 0 || !!selected;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __saveClicked(event, args) {
        const storage = this._storages.selected;
        const dataChecked = this._data.checked;
        const dataSelected = this._data.selected;

        if(!storage) {
            return;
        }
        
        let ids = [];
        if(dataSelected) {
            ids.push(dataSelected.value.id);
        }
        if(dataChecked.length > 0) {
            dataChecked.forEach((d) => {
                ids.push(d.value.id);
            });
        }
        ids = Array.unique(ids);

        this._data.UncheckAllRows();
        this._data.UnselectAllRows();

        if(this._publicationCallback) {
            this._publicationCallback(storage.tag, ids);
        }

    }


}