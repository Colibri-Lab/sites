
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
        this._save.AddHandler('Clicked', (event, args) => this.__saveClicked(event, args));

    }

    Show(publicationCallback) {

        this._publicationCallback = publicationCallback;
        this.shown = true;   

    }

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
        
        this._data.storage = selection.tag;
        Sites.LoadData(this._data.storage, this._searchInput.value, 1, 20, true).then((response) => {
            this._data.value = response.result;
        }); 
        
    }

    __dataSelectionChanged(event, args) {
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._save.enabled = checked.length > 0 || !!selected;
    }

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