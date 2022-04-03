

App.Modules.Sites = class extends Colibri.Modules.Module {

    /** @constructor */
    constructor() {
        super('Sites');
    }

    

    InitializeModule() {

        this._pages = {};
        this._pageMap = {
            // profile: {
            //     route: '/sites/structure/',
            //     handle: () => {
            //         Colibri.Common.Wait(() => this._store.Query('sites.structure').id).then(() => {
            //             if(this.IsCommandAllowed('sites.structure')) {
            //                 this.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(pages)', 'app.security.user')
            //                     .then((data) => {
            //                         this.SaveUser(data);
            //                     })
            //                     .catch(() => {});
            //             }
            //             else {
            //                 App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            //             }
            //         });
                    
            //     }
            // },
            structure: {
                className: 'App.Modules.Sites.StructurePage', 
                title: 'Структура сайта',
                color: 'orange',
                route: '/structure/'
            }
            
        }

        this._store = App.Store.AddChild('app.sites', {});
        this._store.AddPathLoader('sites.pages', () => this.Pages(true));


        console.log('Initializing module Sites');

        App.AddHandler('ApplicationReady', (event, args) => {
            this.Render(document.body);

        });

        Object.forEach(this._pageMap, (name, info) => {
            App.Router.AddRoutePattern(info.route, info.handle ?? ((url, options) => this.ShowPage(name)));
        });

    }

    Render(container) {
        console.log('Rendering Module Sites');
        

    }

    RegisterEvents() {
        console.log('Registering module events for Sites');
        

    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Sites');

        this.AddHandler('RoutedToModule', (event, args) => {
            
        });

    }

    ShowPage(name) {
        Colibri.Common.Wait(() => Security.Store.Query('security.user').id).then(() => {
            if(Security.IsCommandAllowed('sites.' + name)) {
        
                const pageInfo = this._pageMap[name];
                const componentClass = pageInfo.className;
                const title = pageInfo.title;
                const route = pageInfo.route;

                const componentObject = eval(componentClass);
                if(!componentObject) {
                    return;
                }

                let container = null;
                if(!this._pages[componentClass]) {

                    container = MainFrame.AddTab(componentClass, title, 'orange', true, name + '-container', () => {
                        this.RemovePage(name);
                    }, route);    

                    if(!this._pages[componentClass]) {
                        this._pages[componentClass] = new componentObject(name, container);
                    }
                    if(!this._pages[componentClass].isConnected) {
                        this._pages[componentClass].ConnectTo(container);
                    }
                    this._pages[componentClass].Show();

                }
                else if(MainFrame) {
                    MainFrame.SelectTab(this._pages[componentClass].parent);
                }

            }
            else {
                App.Notices && App.Notices.Add({
                    severity: 'error',
                    title: 'Действие запрещено',
                    timeout: 5000
                });
            }
        });


    }

    RemovePage(name) {
        const pageInfo = this._pageMap[name];
        const componentClass = pageInfo.className;

        if(this._pages[componentClass]) {
            this._pages[componentClass].Dispose();
            this._pages[componentClass].parent.Dispose();
            this._pages[componentClass] = null;
        }
    }

    SaveFolder(data) {
        this.Call('Pages', 'Save', data)
            .then((response) => {
                const saved = response.result;
                App.Notices.Add(new Colibri.UI.Notice('Страница сохранена', Colibri.UI.Notice.Success, 3000));
                const pages = Object.values(this._store.Query('sites.pages'));
                let found = null;
                pages.forEach((page) => {
                    if(page.id == saved.id) {
                        found = page;
                        return false;
                    }
                    return true;
                });

                if(!found) {
                    pages.push(saved);
                }
                else {
                    found.description = saved.description;
                    found.published = saved.published;
                    found.additional = saved.additional;
                    found.order = saved.order;
                }
                this._store.Set('sites.pages', pages);

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteFolder(id) {
        this.Call('Pages', 'Delete', {id: id})
            .then((response) => {
                const saved = response.result;
                App.Notices.Add(new Colibri.UI.Notice('Страница удалена', Colibri.UI.Notice.Success, 3000));
                const pages = Object.values(this._store.Query('sites.pages'));
                let found = null;
                pages.forEach((page, index) => {
                    if(page.id == id) {
                        found = index;
                        return false;
                    }
                    return true;
                });

                if(found) {
                    pages.splice(found, 1);
                }
                this._store.Set('sites.pages', pages);

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }


    get Store() {
        return this._store;
    }

    Pages(returnPromise = false) {
        const promise = this.Call('Pages', 'List')
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('sites.pages', response.result);
        }).catch((response) => {
            App.Notices && App.Notices.Add({
                severity: 'error',
                title: response.result,
                timeout: 5000
            });
        });
    }
    

}

App.Modules.Sites.Icons = {};
App.Modules.Sites.Icons.FolderIconPublished = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#ff9c00" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';
App.Modules.Sites.Icons.FolderIconUnpublished = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#a5a5a5" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';

const Sites = new App.Modules.Sites();
