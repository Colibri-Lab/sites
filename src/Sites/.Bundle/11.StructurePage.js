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

        this._folders.AddHandler('ContextMenuIconClicked', this.__renderFoldersContextMenu, false, this);
        this._folders.AddHandler('ContextMenuItemClicked', this.__clickOnFoldersContextMenu, false, this);        
        this._folders.AddHandler('DoubleClicked', this.__foldersDoubleClick, false, this);
        this._folders.AddHandler('SelectionChanged', this.__selectionChangedOnFolder, false, this);

        this._publications.AddHandler('SelectionChanged', this.__selectionChangedOnPublication, false, this);
        this._publications.AddHandler('ContextMenuIconClicked', this.__renderPublicationsContextMenu, false, this);
        this._publications.AddHandler('ContextMenuItemClicked', this.__clickOnPublicationsContextMenu, false, this);        
        this._publications.AddHandler('ScrolledToBottom', this.__publicationsScrolledToBottom, false, this);
        this._publications.AddHandler('CheckChanged', this.__checkChangedOnPublications, false, this);
        this._publications.AddHandler('DoubleClicked', this.__doubleClickedOnPublication, false, this);

        this._dragManager.AddHandler('DragDropComplete', this.__dragDropComplete, false, this);
        this._dragManager.AddHandler('DragDropOver', this.__dragDropOver, false, this);

        this._searchInput.AddHandler(['Filled', 'Cleared'], this.__searchInputFilled, false, this);

        this._deleteData.AddHandler('Clicked', this.__deleteDataButtonClicked, false, this);
        this._addData.AddHandler('Clicked', this.__addDataButtonClicked, false, this);
        this._editData.AddHandler('Clicked', this.__editDataButtonClicked, false, this);
        this._publishButton.AddHandler('Clicked', this.__publishButtonClicked, false, this);

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderFoldersContextMenu(event, args) {

        let contextmenu = [];
        
        const itemData = args.item?.tag;
        if(!itemData) {
            contextmenu.push({name: 'new-domain', title: '#{sites-structure-contextmenu-newdomain}', icon: Colibri.UI.ContextMenuAddIcon});

            this._folders.contextmenu = contextmenu;
            this._folders.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RT, Colibri.UI.ContextMenu.LT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }
        else {
            
            contextmenu.push({name: 'new-child-folder', title: '#{sites-structure-contextmenu-newchild}', icon: Colibri.UI.ContextMenuAddIcon});
            if(itemData.type == 'domain') {
                contextmenu.push({name: 'edit-domain', title: '#{sites-structure-contextmenu-editdomain}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'edit-domain-props', title: '#{sites-structure-contextmenu-editprops}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-domain', title: '#{sites-structure-contextmenu-deletedomain}', icon: Colibri.UI.ContextMenuRemoveIcon});
                contextmenu.push({name: '-'});
                if(!itemData.data.closed) {
                    contextmenu.push({name: 'close', title: '#{sites-structure-contextmenu-close}', icon: Colibri.UI.ContextMenuUnmark});
                } else {
                    contextmenu.push({name: 'open', title: '#{sites-structure-contextmenu-open}', icon: Colibri.UI.ContextMenuMark});
                }
            }
            else {
                contextmenu.push({name: 'edit-folder', title: '#{sites-structure-contextmenu-editpage}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'edit-folder-props', title: '#{sites-structure-contextmenu-editprops}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-folder', title: '#{sites-structure-contextmenu-deletepage}', icon: Colibri.UI.ContextMenuRemoveIcon});
                contextmenu.push({name: '-'});
                if(!itemData.data.published) {
                    contextmenu.push({name: 'publish', title: '#{sites-structure-contextmenu-publish}', icon: Colibri.UI.ContextMenuMark});
                } else {
                    contextmenu.push({name: 'unpublish', title: '#{sites-structure-contextmenu-unpublish}', icon: Colibri.UI.ContextMenuUnmark});
                }    
            }
            contextmenu.push({name: '-'});
            contextmenu.push({name: 'copy-path', title: '#{sites-structure-contextmenu-copypath}', icon: Colibri.UI.CopyIcon});

            args.item.contextmenu = contextmenu;
            args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnFoldersContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-domain') {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('#{sites-structure-windowtitle-newdomain}', 1024, 'app.manage.storages(domains)', {})
                    .then((data) => {
                        Sites.SaveDomain(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-domain') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('#{sites-structure-windowtitle-editdomain}', 1024, 'app.manage.storages(domains)', item.tag.data)
                    .then((data) => {
                        Sites.SaveDomain(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'edit-domain-props') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Sites.Properties('domains', item.tag.data)
                    .then((properties) => {
                        if(Object.countKeys(properties.fields) > 0) {                            
                            Manage.FormWindow.Show('#{sites-structure-windowtitle-editdomainprops}', 750, properties, item.tag.data.parameters)
                                .then((data) => {
                                    Sites.SaveProperties('domains', item.tag.data, data);
                                })
                                .catch(() => {});
                        }
                        else {
                            App.Alert.Show('#{sites-structure-windowtitle-editdomainprops}', '#{sites-structure-windowtitle-noeditdomainprops}', '#{sites-structure-windowtitle-noeditdomainprops-close}');
                        }
                    });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-domain') {
            App.Confirm.Show('#{sites-structure-deletedomain}', '#{sites-structure-deletedomainmessage}', '#{sites-structure-deletedomainmessage-delete}').then(() => {
                Sites.DeleteDomain(item.tag.data.id);
            });
        }
        else if(menuData.name == 'new-child-folder') {

            if(Security.IsCommandAllowed('sites.structure.add')) {

                const dta = {};
                if(item.tag.type == 'domain') {
                    dta.domain = item.tag.data;    
                    dta.parent = null;
                }
                else {
                    dta.domain = item.tag.data.domain;
                    dta.parent = item.tag.data;
                }

                Manage.FormWindow.Show('#{sites-structure-windowtitle-newchildpage}', 1024, 'app.manage.storages(pages)', dta)
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
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'edit-folder') {
            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('#{sites-structure-windowtitle-editpage}', 1024, 'app.manage.storages(pages)', item.tag.data)
                    .then((data) => {
                        data.domain = item.tag?.data?.domain?.id;
                        data.parent = item.tag?.data?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-folder-props') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Sites.Properties('pages', item.tag.data)
                    .then((properties) => {
                        if(Object.countKeys(properties.fields) > 0) {                            
                            Manage.FormWindow.Show('#{sites-structure-windowtitle-editpageprops}', 750, properties, item.tag.data.parameters)
                                .then((data) => {
                                    Sites.SaveProperties('pages', item.tag.data, data);
                                })
                                .catch(() => {});
                        }
                        else {
                            App.Alert.Show('#{sites-structure-windowtitle-editpageprops}', '#{sites-structure-windowtitle-noeditpageprops}', '#{sites-structure-windowtitle-noeditpageprops-close}');
                        }
                        
                    });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-folder') {
            App.Confirm.Show('#{sites-structure-deletepage}', '#{sites-structure-deletepagemessage}', '#{sites-structure-deletepagemessage-delete}').then(() => {
                Sites.DeleteFolder(item.tag.data.id);
            });
        }
        else if(menuData.name == 'copy-path') {
            const path = this._getPath(item);
            path.copyToClipboard().then(() => {
                App.Alert.Show('#{sites-structure-windowtitle-urlcopied}', '#{sites-structure-windowtitle-urlcopiedtext}', '#{sites-structure-windowtitle-urlcopiedtext-close}');
            }).catch(() => {
                App.Alert.Show('#{sites-structure-windowtitle-urlcopiederror}', '#{sites-structure-windowtitle-urlcopiederrortext}', '#{sites-structure-windowtitle-urlcopiederrortext-close}');
            })
        }
        else if(menuData.name == 'close') {
            item.tag.data.closed = true;
            Sites.SaveDomain(item.tag.data);
        }
        else if(menuData.name == 'open') {
            item.tag.data.closed = false;
            Sites.SaveDomain(item.tag.data);
        }
        else if(menuData.name == 'publish') {
            const data = Object.cloneRecursive(item.tag.data);
            data.published = true;
            data.parent = item.tag?.parent?.id ?? 0;
            data.domain = item.tag?.data?.domain?.id;
            Sites.SaveFolder(data);
        }
        else if(menuData.name == 'unpublish') {
            const data = Object.cloneRecursive(item.tag.data);
            data.published = false;
            data.parent = item.tag?.parent?.id ?? 0;
            data.domain = item.tag?.data?.domain?.id;
            Sites.SaveFolder(data);
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderPublicationsContextMenu(event, args) {
        let contextmenu = [];
        
        contextmenu.push({name: 'edit-data', title: '#{sites-structure-contextmenu-editpub}', icon: Colibri.UI.ContextMenuEditIcon});
        contextmenu.push({name: 'remove-pub', title: '#{sites-structure-windowtitle-deletepub}', icon: Colibri.UI.ContextMenuRemoveIcon});

        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __foldersDoubleClick(event, args) {
        const item = this._folders.selected;
        if(!item) {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('#{sites-structure-windowtitle-newdomain}', 1024, 'app.manage.storages(domains)', {})
                    .then((data) => {
                        Sites.SaveDomain(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else {
            if(Security.IsCommandAllowed('sites.structure.edit')) {
                if(item.tag.type == 'domain') {
                    Manage.FormWindow.Show('#{sites-structure-windowtitle-editdomain}', 1024, 'app.manage.storages(domains)', item.tag.data)
                        .then((data) => {
                            Sites.SaveDomain(data);
                        })
                        .catch(() => {});
                }
                else if(item.tag.type == 'page') {
                    Manage.FormWindow.Show('#{sites-structure-windowtitle-editpage}', 1024, 'app.manage.storages(pages)', item.tag.data)
                        .then((data) => {
                            data.parent = item.tag?.parent?.id ?? 0;
                            data.domain = item.tag?.data?.domain?.id;
                            Sites.SaveFolder(data);
                        })
                        .catch(() => {});
                }
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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
        if(folder) {
            if(folder.type == 'domain') {
                Sites.LoadPublications(folder.data, null, searchTerm, page, 20);
            }
            else {
                Sites.LoadPublications(folder.data.domain, folder.data, searchTerm, page, 20);
            }    
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __searchInputFilled(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __publicationsScrolledToBottom(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, this._publicationsCurrentPage + 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __selectionChangedOnPublication(event, args) {
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __checkChangedOnPublications(event, args) { 
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __deleteDataButtonClicked(event, args) {
        if(this._publications.checked.length == 0) {
            App.Confirm.Show('#{sites-structure-messages-removepublication}', '#{sites-structure-messages-removepublicationmessage}', '#{sites-structure-messages-removepublicationmessage-delete}').then(() => {
                Sites.DeletePublication([this._publications.selected.value.id]);
            });
        }
        else {
            App.Confirm.Show('#{sites-structure-messages-removepublications}', '#{sites-structure-messages-removepublicationsmessage}', '#{sites-structure-messages-removepublicationsmessage-delete}').then(() => {
                let ids = [];
                this._publications.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.DeletePublication(ids);
            });
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __addDataButtonClicked(event, args) {

        Manage.Store.AsyncQuery('manage.storages').then((storages) => {

            const contextmenu = [];
            Object.forEach(storages, (name, storage) => {
                if(storage.params.visible && storage.params.maybepublished) {
                    contextmenu.push({name: storage.name, title: storage.desc[Lang.Current] ?? storage.desc, icon: App.Modules.Sites.Icons.ContextMenuStorageIcon});
                }
            });

            const contextMenuObject = new Colibri.UI.ContextMenu('storages-list', document.body, [Colibri.UI.ContextMenu.LT, Colibri.UI.ContextMenu.LB]);
            contextMenuObject.Show(contextmenu, this._addData);
            contextMenuObject.AddHandler('Clicked', (event, args) => {
                contextMenuObject.Hide();
                const menuData = args.menuData;
                if(Security.IsCommandAllowed('sites.storages.' + menuData.name + '.edit')) {
                    Manage.FormWindow.Show('#{sites-structure-windowtitle-newrow} «' + menuData.title + '»', 1024, 'app.manage.storages(' + menuData.name + ')', {})
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
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
                }
                contextMenuObject.Dispose();
            });
            
        });


    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __doubleClickedOnPublication(event, args) {
        this._editData.Dispatch('Clicked');
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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
                Manage.FormWindow.Show('#{sites-structure-windowtitle-newrow} «' + (storage.desc[Lang.Current] ?? storage.desc) + '»', 1024, 'app.manage.storages(' + storage.name + ')', data)
                    .then((data) => {
                        Sites.SaveData(storage.name, data, pub);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-structurepage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }    
        });
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __publishButtonClicked(event, args) {

        const wnd = new App.Modules.Sites.DataWindow('publish', document.body, '#{sites-structure-windowtitle-publish}');
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

    _getPath(node, add = null) {
        const storageNode = node.FindParent((node) => node.tag.type === 'domain');
        let paths = [];
        let p = node;
        while(p != storageNode) {
            if(p.tag.data) {
                paths.push(p.tag.data.name);
            }
            p = p.parentNode;
        }
        paths.reverse();
        add && paths.push(add);
        let path = paths.join('/').trim(/\//);
        return '/' + (path ? path + '/' : '');
    }

}