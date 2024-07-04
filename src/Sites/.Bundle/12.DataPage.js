App.Modules.Sites.DataPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.DataPage']);

        this.AddClass('app-data-page-component');
        this._filterData = {};

        this._storages = this.Children('split/storages-pane/storages');
        this._data = this.Children('split/data-pane/data');
        this._searchInput = this.Children('split/data-pane/search-pane/search-input');
        this._searchFilter = this.Children('split/data-pane/search-pane/filters');
        this._addData = this.Children('split/data-pane/buttons-pane/add-data');
        this._dublData = this.Children('split/data-pane/buttons-pane/dubl-data');
        this._editData = this.Children('split/data-pane/buttons-pane/edit-data');
        this._deleteData = this.Children('split/data-pane/buttons-pane/delete-data');
        this._restoreData = this.Children('split/data-pane/buttons-pane/restore-data');
        this._exportData = this.Children('split/data-pane/buttons-pane/export-data');
        this._pagerData = this.Children('split/data-pane/buttons-pane/pager');


        this._storages.AddHandler('SelectionChanged', (event, args) => this.__storagesSelectionChanged(event, args));

        // this._data.AddHandler('ScrolledToBottom', (event, args) => this.__dataScrolledToBottom(event, args));
        this._pagerData.AddHandler('Changed', (event, args) => this.__pagerDataChanged(event, args));
        this._data.AddHandler('SelectionChanged', (event, args) => this.__dataSelectionChanged(event, args));
        this._data.AddHandler('CheckChanged', (event, args) => this.__checkChangedOnData(event, args));
        this._data.AddHandler('DoubleClicked', (event, args) => this.__doubleClickedOnData(event, args));
        this._data.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderDataContextMenu(event, args));
        this._data.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnDataContextMenu(event, args));
        this._data.AddHandler('ColumnClicked', (event, args) => this.__clickOnDataColumn(event, args));

        this._deleteData.AddHandler('Clicked', (event, args) => this.__deleteDataButtonClicked(event, args));
        this._restoreData.AddHandler('Clicked', (event, args) => this.__restoreDataButtonClicked(event, args));
        this._addData.AddHandler('Clicked', (event, args) => this.__addDataButtonClicked(event, args));
        this._editData.AddHandler('Clicked', (event, args) => this.__editDataButtonClicked(event, args));
        this._dublData.AddHandler('Clicked', (event, args) => this.__dublDataButtonClicked(event, args));
        this._exportData.AddHandler('Clicked', (event, args) => this.__exportDataButtonClicked(event, args));

        this._searchInput.AddHandler(['Filled', 'Cleared'], (event, args) => this.__searchInputFilled(event, args));
        this._searchFilter.AddHandler('Clicked', (event, args) => this.__searchFilterClicked(event, args));
    }

    _addAdditionalModuleMethods() {

        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        const module = storage.module;
        const m = eval(module);
        if (m?.DataPageAdditionalMethods ?? false) {
            m.DataPageAdditionalMethods(this, storage).then(methods => {
                storage.methods = methods;
            });
        }

    }

    _showFilters() {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        Manage.FilterWindow.Show('#{sites-structure-filter} «' + (storage.desc[Lang.Current] ?? storage.desc ?? '') + '»', 800, 'app.manage.storages(' + storage.name + ')', this._filterData)
            .then((data) => {
                this._filterData = data;
                if (Object.countKeys(this._filterData) > 0) {
                    this._searchFilter.AddClass('-selected');
                } else {
                    this._searchFilter.RemoveClass('-selected');
                }
                this._data.storage = storage;
                this._loadDataPage(storage, this._searchInput.value, this._filterData, this._data.sortColumn?.name, this._data.sortOrder, 1);
            })
            .catch(() => { });
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __searchFilterClicked(event, args) {
        this._showFilters();
    }


    _loadDataPage(storage, searchTerm, searchFilters, sortField, sortOrder, page) {
        this._pagerData.value = page;
        Sites.LoadData(storage, searchTerm, searchFilters, sortField, sortOrder, page, 20);
    }


    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __searchInputFilled(event, args) {
        const selected = this._storages.selected;
        if (!selected || (selected.tag === 'module' || selected.tag === 'group')) {
            this._data.storage = null;
            this._data.ClearAll();
            return;
        }

        this._data.storage = selected.tag;
        this._loadDataPage(selected?.tag, this._searchInput.value, this._filterData, this._data.sortColumn?.name, this._data.sortOrder, 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __storagesSelectionChanged(event, args) {

        const selection = this._storages.selected;

        this._searchInput.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';
        this._searchFilter.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';
        this._data.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';
        this._data.UnselectAllRows();
        this._data.UncheckAllRows();
        this._addData.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';
        this._exportData.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';
        this._editData.enabled = false;
        this._dublData.enabled = false;
        this._deleteData.enabled = false;
        this._pagerData.enabled = selection != null && selection.tag !== 'module' && selection.tag !== 'group';

        this.__searchInputFilled(event, args);

        this._addAdditionalModuleMethods();

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __pagerDataChanged(event, args) {
        const selected = this._storages.selected;
        this._loadDataPage(selected?.tag, this._searchInput.value, this._filterData, this._data.sortColumn?.name, this._data.sortOrder, this._pagerData.value);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __dataSelectionChanged(event, args) {
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._dublData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __checkChangedOnData(event, args) {
        const checked = this._data.checked;
        const selected = this._data.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __doubleClickedOnData(event, args) {
        this._editData.Dispatch('Clicked');
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __restoreDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }
        if (this._data.checked.length == 0) {
            App.Confirm.Show('#{sites-structure-restoredata}', '#{sites-structure-restoredatamessage}', '#{sites-structure-restoredatamessage-delete}').then(() => {
                Sites.RestoreData(storage, [this._data.selected?.value?.id]);
            });
        }
        else {
            App.Confirm.Show('#{sites-structure-restoredatas}', '#{sites-structure-restoredatasmessage}', '#{sites-structure-restoredatasmessage-delete}').then(() => {
                let ids = [];
                this._data.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.RestoreData(storage, ids);
            });
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __deleteDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }
        if (this._data.checked.length == 0) {
            App.Confirm.Show('#{sites-structure-deletedata}', '#{sites-structure-deletedatamessage}', '#{sites-structure-deletedatamessage-delete}').then(() => {
                Sites.DeleteData(storage, [this._data.selected?.value?.id]);
            });
        }
        else {
            App.Confirm.Show('#{sites-structure-deletedatas}', '#{sites-structure-deletedatasmessage}', '#{sites-structure-deletedatasmessage-delete}').then(() => {
                let ids = [];
                this._data.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.DeleteData(storage, ids);
            });
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __addDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        if (Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
            Manage.FormWindow.Show('#{sites-structure-newrow} «' + (storage.desc[Lang.Current] ?? storage.desc ?? '') + '»', 1024, 'app.manage.storages(' + storage.name + ')', {})
                .then((data) => {
                    Sites.SaveData(storage.name, data);
                })
                .catch(() => { });
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{sites-datapage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }


    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __editDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        const dta = this._data.selected?.value;
        if (!storage || !dta) {
            return;
        }

        if (Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
            Manage.FormWindow.Show('#{sites-structure-editrow} «' + (storage.desc[Lang.Current] ?? storage.desc ?? '') + '»', 1024, 'app.manage.storages(' + storage.name + ')', dta)
                .then((data) => {
                    Sites.SaveData(storage.name, data);
                })
                .catch(() => { });
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{sites-datapage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __dublDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        const dta = this._data.selected?.value;
        if (!storage || !dta) {
            return;
        }

        delete dta.id;

        if (Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
            Manage.FormWindow.Show('#{sites-structure-newrow} «' + (storage.desc[Lang.Current] ?? storage.desc ?? '') + '»', 1024, 'app.manage.storages(' + storage.name + ')', dta)
                .then((data) => {
                    Sites.SaveData(storage.name, data);
                })
                .catch(() => { });
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{sites-datapage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __exportDataButtonClicked(event, args) {
        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        Sites.ExportData(storage, this._searchInput.value, this._filterData, this._data.sortColumn?.name, this._data.sortOrder);
    }


    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __renderDataContextMenu(event, args) {
        let contextmenu = [];
        this._data.selected = args.item;

        contextmenu.push({ name: 'dubl-data', title: '#{sites-structure-contextmenu-dublicate}', icon: Colibri.UI.ContextMenuDublicateIcon });
        contextmenu.push({ name: 'edit-data', title: '#{sites-structure-contextmenu-edit}', icon: Colibri.UI.ContextMenuEditIcon });

        if (!args.item.value.datedeleted) {
            contextmenu.push({ name: 'remove-data', title: '#{sites-structure-contextmenu-delete}', icon: Colibri.UI.ContextMenuRemoveIcon });
        } else {
            contextmenu.push({ name: 'restore-data', title: '#{sites-structure-contextmenu-restore}', icon: Colibri.UI.ContextMenuRemoveIcon });
        }

        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        if (storage.methods?.contextmenu) {
            contextmenu = contextmenu.concat([{name: '-'}]);
            contextmenu = contextmenu.concat(storage.methods?.contextmenu);
        }

        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? { left: args.domEvent.clientX, top: args.domEvent.clientY } : null);

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __clickOnDataContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if (!menuData) {
            return false;
        }

        if (menuData.name == 'edit-data') {
            this._editData.Dispatch('Clicked');
        }
        else if (menuData.name == 'dubl-data') {
            this._dublData.Dispatch('Clicked');
        }
        else if (menuData.name == 'remove-data') {
            this._deleteData.Dispatch('Clicked');
        }
        else if (menuData.name == 'restore-data') {
            this._restoreData.Dispatch('Clicked');
        }

        const selection = this._storages.selected;
        const storage = selection?.tag;
        if (!storage) {
            return;
        }

        const module = storage.module;
        const m = eval(module);
        let dta = this._data.selected?.value;
        const checked = this._data.checked;
        if (checked.length > 0) {
            dta = checked.map(v => v.value);
        }

        if (storage.methods?.contextmenu) {
            m?.DataPageAdditionalExecuteMethod(menuData, storage, dta).then(() => {
                this._loadDataPage(
                    storage, 
                    this._searchInput.value, 
                    this._filterData, 
                    this._data.sortColumn?.name, 
                    this._data.sortOrder, 
                    this._pagerData.value
                );
            });
        }

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */
    __clickOnDataColumn(event, args) {
        if(this._data.sortColumn?.name === 'button-container-for-row-selection') {
            return;
        }
        this.__searchInputFilled(event, args);
    }

}