App.Modules.Sites.StoragesPage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StoragesPage']);

        this.AddClass('app-sites-storages-page-component');

        this._storages = this.Children('storages-pane/storages');

        this._storages.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderStoragesContextMenu(event, args))
        this._storages.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnStoragesContextMenu(event, args));        


    }

    _canAddFieldAsChild(field) {
        return field.type === 'json';
    }

    _findStorageNode(fieldNode) {
        let f = fieldNode;
        while(f && f.tag.type && f.tag.type != 'storage') {
            f = f.parentNode;
        }
        return f;
    }

    __renderStoragesContextMenu(event, args) {

        let contextmenu = [];

        const node = args.item;
        const tag = node.tag;
        const nodeType = tag.type;
        switch(nodeType) {
            case 'module':
                contextmenu.push({name: 'new-storage', title: 'Новое хранилище', icon: Colibri.UI.ContextMenuAddIcon});
                break;
            case 'storage':
                contextmenu.push({name: 'edit-storage', title: 'Редактировать свойства хранилища', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-storage', title: 'Удалить хранилище', icon: Colibri.UI.ContextMenuRemoveIcon});
                contextmenu.push({name: 'new-field', title: 'Новое свойство', icon: Colibri.UI.ContextMenuAddIcon});
                break;
            case 'field':
                contextmenu.push({name: 'edit-field', title: 'Редактировать свойство', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-field', title: 'Удалить свойство', icon: Colibri.UI.ContextMenuRemoveIcon});
                if(this._canAddFieldAsChild(tag.entry)) {
                    contextmenu.push({name: 'new-field', title: 'Новое свойство', icon: Colibri.UI.ContextMenuAddIcon});
                }
                break;
        }

        node.contextmenu = contextmenu;
        node.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        
    }

    __clickOnStoragesContextMenu(event, args) {

        const node = this._storages.selected;
        if(!node) {
            return false;
        }

        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-storage') {
            if(Security.IsCommandAllowed('sites.storages.add')) {
                Manage.FormWindow.Show('Новое хранилище', 1024, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-storage') {

            if(Security.IsCommandAllowed('sites.storages.edit')) {
                Manage.FormWindow.Show('Редактировать хранилище', 1024, 'app.manage.storages(pages)', node.tag.entry)
                    .then((data) => {
                        data.parent = node.tag.entry?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-storage') {
            App.Confirm.Show('Удаление хранилища данных', 'Вы уверены, что хотите удалить хранилище данных?', 'Удалить!').then(() => {
                Sites.DeleteFolder(node.tag.entry.id);
            });
        }
        else if(menuData.name == 'new-field') {
            const storageNode = this._findStorageNode(node);
            if(Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('Новое свойство', 1024, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-field') {
            const storageNode = this._findStorageNode(node);
            if(Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('Редактировать свойство', 1024, 'app.manage.storages(pages)', node.tag.entry)
                    .then((data) => {
                        data.parent = node.tag.entry?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-field') {
            const storageNode = this._findStorageNode(node);
            if(Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('Удаление свойства', 'Вы уверены, что хотите удалить свойство?', 'Удалить!').then(() => {
                    Sites.DeleteFolder(node.tag.entry.id);
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
            
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
                Manage.FormWindow.Show('Редактировать раздел', 1024, 'app.manage.storages(pages)', node.tag.entry)
                    .then((data) => {
                        data.parent = node.tag.entry?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
    }

    __dragDropComplete(event, args) {

        const dragged = args.dragged;
        const droppedTo = args.droppedTo;

        if(dragged instanceof Colibri.UI.TreeNode && droppedTo instanceof Colibri.UI.TreeNode) {
            // Перетаскивание нодов
            const folderMoving = dragged.tag;
            const folderTo = droppedTo.tag;
            Sites.MoveFolder(folderMoving, folderTo);
        }
        else if(dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.TreeNode) {
            // копирование публикации
            const pub = dragged.value;
            const folderTo = droppedTo.tag;
            Sites.CopyPublication(pub, folderTo);
        }


    }

    _loadPublicationsPage(folder, searchTerm, page) {
        this._publicationsCurrentPage = page;
        Sites.LoadPublications(folder, searchTerm, page, 20);
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
                            const selected = this._folders.selected;
                            Sites.CreatePublication(selected.tag, menuData.name, data);
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
            const selected = this._folders.selected;
            Sites.Publish(selected?.tag, storage.name, dataIds);
        }); 


    }


}