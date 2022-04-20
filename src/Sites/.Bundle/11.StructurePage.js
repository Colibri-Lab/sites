App.Modules.Sites.StructurePage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StructurePage']);

        this.AddClass('app-sites-pages-page-component');

        this._folders = this.Children('split/folders-pane/folders');
        this._publications = this.Children('split/publications-pane/publications');
        this._dragManager = new Colibri.UI.DragManager([this._publications, this._folders], [this._folders, this._publications]);
        
        this._publishButton = this.Children('split/publications-pane/buttons-pane/publish');
        this._addData = this.Children('split/publications-pane/buttons-pane/add-data');
        this._editData = this.Children('split/publications-pane/buttons-pane/edit-data');
        this._deleteData = this.Children('split/publications-pane/buttons-pane/delete-data');

        this._searchInput = this.Children('split/publications-pane/search-pane/search-input');

        this._folders.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderFoldersContextMenu(event, args));
        this._folders.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnFoldersContextMenu(event, args));        
        this._folders.AddHandler('DoubleClicked', (event, args) => this.__foldersDoubleClick(event, args));
        this._folders.AddHandler('SelectionChanged', (event, args) => this.__selectionChangedOnFolder(event, args));

        this._publications.AddHandler('SelectionChanged', (event, args) => this.__selectionChangedOnPublication(event, args));
        this._publications.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderPublicationsContextMenu(event, args));
        this._publications.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnPublicationsContextMenu(event, args));        
        this._publications.AddHandler('ScrolledToBottom', (event, args) => this.__publicationsScrolledToBottom(event, args));
        this._publications.AddHandler('CheckChanged', (event, args) => this.__checkChangedOnPublications(event, args));
        this._publications.AddHandler('DoubleClicked', (event, args) => this.__doubleClickedOnPublication(event, args));

        this._dragManager.AddHandler('DragDropComplete', (event, args) => this.__dragDropComplete(event, args));
        this._dragManager.AddHandler('DragDropOver', (event, args) => this.__dragDropOver(event, args));

        this._searchInput.AddHandler(['Filled', 'Cleared'], (event, args) => this.__searchInputFilled(event, args));

        this._deleteData.AddHandler('Clicked', (event, args) => this.__deleteDataButtonClicked(event, args));
        this._addData.AddHandler('Clicked', (event, args) => this.__addDataButtonClicked(event, args));
        this._editData.AddHandler('Clicked', (event, args) => this.__editDataButtonClicked(event, args));
        this._publishButton.AddHandler('Clicked', (event, args) => this.__publishButtonClicked(event, args));

    }

    __renderFoldersContextMenu(event, args) {

        let contextmenu = [];
        
        const itemData = args.item?.tag;
        if(!itemData) {
            contextmenu.push({name: 'new-domain', title: 'Новый домен', icon: Colibri.UI.ContextMenuAddIcon});

            this._folders.contextmenu = contextmenu;
            this._folders.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left top', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }
        else {
            
            contextmenu.push({name: 'new-child-folder', title: 'Новый дочерний раздел', icon: Colibri.UI.ContextMenuAddIcon});
            if(itemData.type == 'domain') {
                contextmenu.push({name: 'edit-domain', title: 'Редактировать домен', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'edit-domain-props', title: 'Редактировать доп. свойства', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-domain', title: 'Удалить домен', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            else {
                contextmenu.push({name: 'edit-folder', title: 'Редактировать раздел', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'edit-folder-props', title: 'Редактировать доп. свойства', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-folder', title: 'Удалить раздел', icon: Colibri.UI.ContextMenuRemoveIcon});
            }

            args.item.contextmenu = contextmenu;
            args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        

    }

    __clickOnFoldersContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-domain') {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый домен', 1024, 'app.manage.storages(domains)', {})
                    .then((data) => {
                        Sites.SaveDomain(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-domain') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать домен', 1024, 'app.manage.storages(domains)', item.tag.data)
                    .then((data) => {
                        Sites.SaveDomain(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'edit-domain-props') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Sites.Properties('domains', item.tag.data)
                    .then((properties) => {
                        Manage.FormWindow.Show('Редактировать доп. свойства домена', 750, properties, item.tag.data.parameters)
                            .then((data) => {
                                Sites.SaveProperties('domains', item.tag.data, data);
                            })
                            .catch(() => {});
                    });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-domain') {
            App.Confirm.Show('Удаление домена', 'Вы уверены, что хотите удалить домен? Все папки и публикации будут удалены безвозвратно', 'Удалить!').then(() => {
                Sites.DeleteDomain(item.tag.data.id);
            });
        }
        else if(menuData.name == 'new-child-folder') {

            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый дочерний раздел', 1024, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        if(item.tag.type == 'domain') {
                            data.domain = item.tag.data.id;    
                            data.parent = 0;
                        }
                        else {
                            data.domain = item.tag.data.domain.id;
                            data.parent = item.tag.data.id;
                        }
                        item.Expand();
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'edit-folder') {
            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать раздел', 1024, 'app.manage.storages(pages)', item.tag.data)
                    .then((data) => {
                        data.domain = item.tag?.data?.domain?.id;
                        data.parent = item.tag?.data?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-folder-props') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Sites.Properties('pages', item.tag.data)
                    .then((properties) => {
                        Manage.FormWindow.Show('Редактировать доп. свойства страницы', 750, properties, item.tag.data.parameters)
                        .then((data) => {
                            Sites.SaveProperties('pages', item.tag.data, data);
                        })
                        .catch(() => {});
                    });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-folder') {
            App.Confirm.Show('Удаление папки', 'Вы уверены, что хотите удалить папку?', 'Удалить!').then(() => {
                Sites.DeleteFolder(item.tag.data.id);
            });
        }
    }

    __renderPublicationsContextMenu(event, args) {
        let contextmenu = [];
        
        contextmenu.push({name: 'edit-data', title: 'Редактировать данные публикации', icon: Colibri.UI.ContextMenuEditIcon});
        contextmenu.push({name: 'remove-pub', title: 'Удалить публикацию', icon: Colibri.UI.ContextMenuRemoveIcon});

        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        
    }

    __clickOnPublicationsContextMenu(event, args) {

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

    __foldersDoubleClick(event, args) {
        const item = this._folders.selected;
        if(!item) {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый раздел', 1024, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else {
            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать раздел', 1024, 'app.manage.storages(pages)', item.tag)
                    .then((data) => {
                        data.parent = item.tag?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
    }

    __dragDropOver(event, args) {
        const dragged = args.dragged;
        const droppedTo = args.droppedTo;
        const droppedToElement = args.droppedToElement;
        const effects = args.effects;
        if(dragged instanceof Colibri.UI.TreeNode && droppedTo instanceof Colibri.UI.TreeNode && dragged.tag.type != 'domain') {
            effects.dropEffect = 'move';
            this._folders.sorting = true;
        }
        else if(dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.TreeNode) {
            effects.dropEffect = 'copy';
            this._folders.sorting = false;
        }
        else if(dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.Grid.Row) {
            effects.dropEffect = 'move';
        }
    }

    __dragDropComplete(event, args) {

        const dragged = args.dragged;
        const droppedTo = args.droppedTo;
        const droppedToElement = args.droppedToElement;

        if(dragged instanceof Colibri.UI.TreeNode && droppedTo instanceof Colibri.UI.TreeNode && dragged.tag.type != 'domain') {
            // Перетаскивание нодов
            let folderMoving = dragged.tag.data;
            let folderTo = droppedTo.tag.data;
            let domainTo = null;
            if(droppedTo.tag.type == 'domain') {
                domainTo = folderTo;
                folderTo = null;
            }
            else {
                domainTo = folderTo.domain;
            }
            
            Sites.MoveFolder(folderMoving, domainTo, folderTo, droppedToElement.attr('drop'));
        }
        else if(dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.TreeNode) {
            // копирование публикации
            let pub = dragged.value;
            let folderTo = droppedTo.tag.data;
            let domainTo = null;
            if(droppedTo.tag.type == 'domain') {
                domainTo = folderTo;
                folderTo = null;
            }
            else {
                domainTo = folderTo.domain;
            }
            Sites.CopyPublication(pub, domainTo, folderTo);
        }
        else if(dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.Grid.Row) {
            const pub = dragged.value;
            const pubBefore = droppedTo.value;
            Sites.MovePublication(pub, pubBefore);
        }


    }

    _loadPublicationsPage(folder, searchTerm, page) {
        this._publicationsCurrentPage = page;
        if(folder.type == 'domain') {
            Sites.LoadPublications(folder.data, null, searchTerm, page, 20);
        }
        else {
            Sites.LoadPublications(folder.data.domain, folder.data, searchTerm, page, 20);
        }
    }

    __searchInputFilled(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, 1);
    }

    __publicationsScrolledToBottom(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, this._publicationsCurrentPage + 1);
    }

    __selectionChangedOnFolder(event, args) {

        const selected = this._folders.selected;

        this._searchInput.enabled = selected != null;
        this._publications.enabled = selected != null;
        this._publishButton.enabled = selected != null;
        this._addData.enabled = selected != null;
        this._editData.enabled = false;
        this._deleteData.enabled = false;
        this._publications.UnselectAllRows();
        this._publications.UncheckAllRows();
        
        this.__searchInputFilled(event, args);

    }

    __selectionChangedOnPublication(event, args) {
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __checkChangedOnPublications(event, args) { 
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __deleteDataButtonClicked(event, args) {
        if(this._publications.checked.length == 0) {
            App.Confirm.Show('Удаление публикации', 'Вы уверены, что хотите удалить выбранную публикацию?', 'Удалить!').then(() => {
                Sites.DeletePublication([this._publications.selected.value.id]);
            });
        }
        else {
            App.Confirm.Show('Удаление публикации', 'Вы уверены, что хотите удалить выбранные публикации?', 'Удалить!').then(() => {
                let ids = [];
                this._publications.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.DeletePublication(ids);
            });
        }
    }

    __addDataButtonClicked(event, args) {

        Manage.Store.AsyncQuery('manage.storages').then((storages) => {

            const contextmenu = [];
            Object.forEach(storages, (name, storage) => {
                if(storage.params.visible && storage.params.maybepublished) {
                    contextmenu.push({name: storage.name, title: storage.desc, icon: App.Modules.Sites.Icons.ContextMenuStorageIcon});
                }
            });

            const contextMenuObject = new Colibri.UI.ContextMenu('storages-list', document.body, 'right top');
            contextMenuObject.Show(contextmenu, this._addData);
            contextMenuObject.AddHandler('Clicked', (event, args) => {
                contextMenuObject.Hide();
                const menuData = args.menuData;
                if(Security.IsCommandAllowed('sites.storages.' + menuData.name + '.edit')) {
                    Manage.FormWindow.Show('Новая строка «' + menuData.title + '»', 1024, 'app.manage.storages(' + menuData.name + ')', {})
                        .then((data) => {
                            const selected = this._folders.selected.tag;
                            if(selected.type == 'domain') {
                                Sites.CreatePublication(selected.data, null, menuData.name, data);
                            }
                            else {
                                Sites.CreatePublication(selected.data.domain, selected.data, menuData.name, data);
                            }
                        })
                        .catch(() => {});
                }
                else {
                    App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
                }
                contextMenuObject.Dispose();
            });
            
        });


    }

    __doubleClickedOnPublication(event, args) {
        this._editData.Dispatch('Clicked');
    }

    __editDataButtonClicked(event, args) {
        if(!this._publications.selected) {
            return;
        }
        
        const pub = this._publications.selected.value;

        Promise.all([
            Manage.Store.AsyncQuery('manage.storages(' + pub.storage + ')'),
            Sites.LoadRow(pub.storage, pub.row, pub)
        ]).then((responses) => {
            const storage = responses[0];
            const data = responses[1];
            if(Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
                Manage.FormWindow.Show('Новая строка «' + storage.desc + '»', 1024, 'app.manage.storages(' + storage.name + ')', data)
                    .then((data) => {
                        Sites.SaveData(storage.name, data, pub);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }    
        });
    }

    __publishButtonClicked(event, args) {

        const wnd = new App.Modules.Sites.DataWindow('publish', document.body, 'Публикация данных');
        wnd.Show((storage, dataIds) => {
            const selected = this._folders.selected?.tag;
            if(selected.type == 'domain') {
                Sites.Publish(selected.data, null, storage.name, dataIds);
            }
            else {
                Sites.Publish(selected?.data.domain, selected.data, storage.name, dataIds);
            }
        }); 


    }


}