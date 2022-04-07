App.Modules.Sites.DataPage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.DataPage']);

        this.AddClass('app-data-page-component');

        this._storages = this.Children('split/storages-pane/storages');
        this._data = this.Children('split/data-pane/data');
        this._searchInput = this.Children('split/data-pane/search-pane/search-input');
        this._addData = this.Children('split/data-pane/buttons-pane/add-data');
        this._editData = this.Children('split/data-pane/buttons-pane/edit-data');
        this._deleteData = this.Children('split/data-pane/buttons-pane/delete-data');

        // this._folders.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderFoldersContextMenu(event, args))
        // this._folders.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnFoldersContextMenu(event, args));        
        // this._folders.AddHandler('DoubleClicked', (event, args) => this.__foldersDoubleClick(event, args));

        this._storages.AddHandler('SelectionChanged', (event, args) => this.__storagesSelectionChanged(event, args));

        this._data.AddHandler('ScrolledToBottom', (event, args) => this.__dataScrolledToBottom(event, args));
        this._data.AddHandler('SelectionChanged', (event, args) => this.__dataSelectionChanged(event, args));
        this._data.AddHandler('CheckChanged', (event, args) => this.__checkChangedOnData(event, args));
        this._data.AddHandler('DoubleClicked', (event, args) => this.__doubleClickedOnData(event, args));
        this._data.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderDataContextMenu(event, args));
        this._data.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnDataContextMenu(event, args));        

        this._deleteData.AddHandler('Clicked', (event, args) => this.__deleteDataButtonClicked(event, args));
        this._addData.AddHandler('Clicked', (event, args) => this.__addDataButtonClicked(event, args));
        this._editData.AddHandler('Clicked', (event, args) => this.__editDataButtonClicked(event, args));

        this._searchInput.AddHandler(['Filled', 'Cleared'], (event, args) => this.__searchInputFilled(event, args));

    }

    
    _loadDataPage(storage, searchTerm, page) {
        this._dataCurrentPage = page;
        Sites.LoadData(storage, searchTerm, page, 20);
    }

    
    __searchInputFilled(event, args) {
        const selected = this._storages.selected;
        if(!selected) {
            this._data.ClearAll(); 
            return;           
        }
        this._data.storage = selected.tag;
        this._loadDataPage(selected?.tag, this._searchInput.value, 1);
    }

    __storagesSelectionChanged(event, args) {

        const selection = this._storages.selected;
        
        this._searchInput.enabled = selection != null;
        this._data.enabled = selection != null;
        this._data.UnselectAllRows();
        this._data.UncheckAllRows();
        this._addData.enabled = selection != null;
        this._editData.enabled = false;
        this._deleteData.enabled = false;

        this.__searchInputFilled(event, args);
        
    }

    
    __dataScrolledToBottom(event, args) {
        const selected = this._storages.selected;
        this._loadDataPage(selected?.tag, this._searchInput.value, this._dataCurrentPage + 1);
    }

    __dataSelectionChanged(event, args) {
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __checkChangedOnData(event, args) { 
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __doubleClickedOnData(event, args) {
        this._editData.Dispatch('Clicked');
    }

    __deleteDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if(!storage) {
            return;
        }
        if(this._data.checked.length == 0) {
            App.Confirm.Show('Удаление данных', 'Вы уверены, что хотите удалить выбранную строку?', 'Удалить!').then(() => {
                Sites.DeleteData(storage, [this._data.selected.value.id]);
            });
        }
        else {
            App.Confirm.Show('Удаление данных', 'Вы уверены, что хотите удалить выбранные строки?', 'Удалить!').then(() => {
                let ids = [];
                this._data.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.DeleteData(storage, ids);
            });
        }
    }

    __addDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if(!storage) {
            return;
        }

        if(Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
            Manage.FormWindow.Show('Новая строка «' + storage.desc + '»', 1024, 'app.manage.storages(' + storage.name + ')', {})
                .then((data) => {
                    Sites.SaveData(storage.name, data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
        }
            

    }

    __editDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        const dta = this._data.selected.value;
        if(!storage || !dta) {
            return;
        }

        if(Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
            Manage.FormWindow.Show('Новая строка «' + storage.desc + '»', 1024, 'app.manage.storages(' + storage.name + ')', dta)
                .then((data) => {
                    Sites.SaveData(storage.name, data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
        }

    }

    
    __renderDataContextMenu(event, args) {
        let contextmenu = [];
        
        contextmenu.push({name: 'edit-data', title: 'Редактировать данные', icon: Colibri.UI.ContextMenuEditIcon});
        contextmenu.push({name: 'remove-pub', title: 'Удалить', icon: Colibri.UI.ContextMenuRemoveIcon});

        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        
    }

    __clickOnDataContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'edit-data') {
            this._editData.Dispatch('Clicked');
        }
        else if(menuData.name == 'remove-pub') {
            this._deleteData.Dispatch('Clicked');
        }
    }

}