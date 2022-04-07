

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
                route: '/sites/structure/'
            },
            data: {
                className: 'App.Modules.Sites.DataPage', 
                title: 'Материалы',
                color: 'orange',
                route: '/sites/data/'
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
    
    get Store() {
        return this._store;
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

    /** API */

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
                App.Notices.Add(new Colibri.UI.Notice('Страница удалена', Colibri.UI.Notice.Success, 3000));
                this._store.Set('sites.pages', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    MoveFolder(move, to) {
        this.Call('Pages', 'Move', {move: move.id, to: to?.id ?? null})
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Страница перенесена', Colibri.UI.Notice.Success, 3000));
                this._store.Set('sites.pages', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    CopyPublication(pub, to) {
        this.Call('Publications', 'Copy', {pub: pub.id, to: to?.id ?? null})
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Публикация скопирована', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeletePublication(pubIds) {
        this.Call('Publications', 'Delete', {pubs: pubIds.join(',')})
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Публикация удалена', Colibri.UI.Notice.Success, 3000));

                let pubs = this._store.Query('sites.pubs');
                if(!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }

                let newPubs = [];
                pubs.map((p) => {
                    if(pubIds.indexOf(p.id) === -1) {
                        newPubs.push(p);
                    }
                });
                this._store.Set('sites.pubs', newPubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteData(storage, dataIds) {
        this.Call('Data', 'Delete', {storage: storage.name, ids: dataIds.join(',')})
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Данные удалены', Colibri.UI.Notice.Success, 3000));

                let data = this._store.Query('sites.data');
                if(!data || !Array.isArray(data)) {
                    data = [];
                }
                
                let newData = [];
                data.map((p) => {
                    if(dataIds.indexOf(p.id) === -1) {
                        newData.push(p);
                    }
                });
                this._store.Set('sites.data', newData);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    CreatePublication(folder, storage, data) {

        this.Call('Publications', 'Create', {folder: folder?.id ?? null, storage, data: data})
            .then((response) => {
                let pubs = this._store.Query('sites.pubs');
                if(!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs.push(response.result);
                this._store.Set('sites.pubs', pubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    Publish(folder, storage, ids) {

        this.Call('Publications', 'Publish', {folder: folder?.id ?? null, storage, ids: ids.join(',')})
            .then((response) => {
                let pubs = this._store.Query('sites.pubs');
                if(!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs = pubs.concat(response.result);
                this._store.Set('sites.pubs', pubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    SaveData(storage, data, pub = null) {
        this.Call('Data', 'Save', {storage: storage, data: data, pub: pub?.id ?? null})
            .then((response) => {
                if(pub) {
                    let p = response.result.pub;
                    let pubs = this._store.Query('sites.pubs');
                    if(!pubs || !Array.isArray(pubs)) {
                        pubs = [];
                    }
                    pubs = pubs.map(pp => pp.id == p.id ? p : pp);
                    this._store.Set('sites.pubs', pubs);
                }

                let dtas = this._store.Query('sites.data');
                if(!dtas || !Array.isArray(dtas)) {
                    dtas = [];
                }
                if(data?.id) {
                    // редактирование
                    dtas = dtas.map(dd => dd.id == data.id ? data : dd);
                }
                else {
                    dtas.push(response.result.datarow);
                }
                this._store.Set('sites.data', dtas);

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    LoadRow(storage, rowId) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Row', {storage: storage, row: rowId}).then((response) => {
                resolve(response.result);
            }).catch((response) => {
                reject(response.result);
            });
        });
    }

    LoadPublications(folder, term = null, page = 1, pagesize = 20, returnPromise = false) {
        const promise = this.Call('Publications', 'List', {folder: folder?.id ?? null, term: term, page: page, pagesize: pagesize});
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            if(page == 1) {
                this._store.Set('sites.pubs', response.result);
            }
            else if(Array.isArray(response.result)) {
                let pubs = this._store.Query('sites.pubs');
                if(!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs = pubs.concat(response.result);
                this._store.Set('sites.pubs', pubs);
            }
        })
        .catch(error => {
            App.Notices.Add(new Colibri.UI.Notice(error.result));
            console.error(error);
        });
    }

    LoadData(storage, term = null, page = 1, pagesize = 20, returnPromise = false) {

        const promise = this.Call('Data', 'List', {storage: storage.name, term: term, page: page, pagesize: pagesize});
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            if(page == 1) {
                this._store.Set('sites.data', response.result);
            }
            else if(Array.isArray(response.result)) {
                let data = this._store.Query('sites.data');
                if(!data || !Array.isArray(data)) {
                    data = [];
                }
                data = data.concat(response.result);
                this._store.Set('sites.data', data);
            }
        })
        .catch(error => {
            App.Notices.Add(new Colibri.UI.Notice(error.result));
            console.error(error);
        });
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
App.Modules.Sites.Icons.FolderIconPublished =           '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#ff9c00" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';
App.Modules.Sites.Icons.FolderIconUnpublished =         '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#a5a5a5" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';
App.Modules.Sites.Icons.StorageIcon =                   '<svg id="storages" xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><g><path fill="#fff" d="M168.7,67.839c29.436,0,53.3,6.146,53.3,13.727a60.332,60.332,0,0,0-1.316,9.8c0,3.343,1.318,4.543,1.316,4.576-0.428,7.486-24.13,9.8-53.3,9.8s-52.873-1.011-53.3-8.5a12.747,12.747,0,0,0,1.316-5.883,53.929,53.929,0,0,0-1.316-9.8C115.4,73.985,139.266,67.839,168.7,67.839Z"/><path fill="#fff" d="M168.7,103.79c29.436,0,53.3,6.146,53.3,13.727a30.5,30.5,0,0,0-1.974,9.151A10.045,10.045,0,0,0,222,131.9c-0.428,7.486-24.13,9.805-53.3,9.805s-52.873-1.011-53.3-8.5a13.117,13.117,0,0,0,1.974-6.537,30.319,30.319,0,0,0-1.974-9.151C115.4,109.936,139.266,103.79,168.7,103.79Z"/><path fill="#2e5468" d="M167.054,43c16.141-.074,31.136,1.7,42.6,6.5,4.517,1.889,9.923,4.486,11.792,8.987,0.872,2.1.464,6.463,0.464,9.357v8.145a21.812,21.812,0,0,1-.066,4.073,8.463,8.463,0,0,1-1.358,3.1c-3.3,4.73-10.257,7.258-16.363,9.189-18.916,5.983-50.47,6.2-69.623.236-6.489-2.019-14.385-4.779-17.555-10.03a8.135,8.135,0,0,1-.961-2.491,18.083,18.083,0,0,1-.066-3.366V63.366a14.576,14.576,0,0,1,.4-4.712c1.424-3.683,5.018-5.835,8.38-7.573a68.024,68.024,0,0,1,14.242-4.948l6.028-1.212c2.509-.553,5.15-0.627,7.751-1.077l7.386-.606,2.849-.135Zm-0.563,9.021-2.55.067-6.956.438-5.035.572c-4.6.863-9.035,1.521-12.851,3.1-1.946.8-7.036,3.006-5.1,6.16,1.844,3.005,7.7,4.344,11.692,5.352,2.534,0.64,5.3.9,8.049,1.38l3.577,0.337,3.677,0.269a59.332,59.332,0,0,0,8.479.236,98.433,98.433,0,0,0,20.867-1.851c3.988-.884,7.824-1.676,10.864-3.5,1.2-.718,2.624-1.552,2.981-3.1a2.786,2.786,0,0,0-.96-2.592,14.983,14.983,0,0,0-5.863-3.2C188.785,52.636,177.991,52.039,166.491,52.023ZM117.768,92.38c0.783,0.611,1.332,1.558,2.12,2.188a27.551,27.551,0,0,0,5.8,3.635,79.076,79.076,0,0,0,8.678,3.231c16.994,5.375,45.927,6,64.225,1.279,6.742-1.741,12.988-3.57,17.919-7.1a14.428,14.428,0,0,0,3.511-3.231l0.132,0.1,0.663,1.01a8.949,8.949,0,0,1,1.06,2.659l0.033,14c0,3.28.224,6.216-.994,8.246-3.114,5.192-10.5,7.861-16.826,9.863-19.037,6.021-50.581,6.145-69.789.168-4.963-1.545-9.543-3.208-13.315-5.924a12.607,12.607,0,0,1-2.551-2.121,11.01,11.01,0,0,1-2.252-3.6c-0.571-1.84-.265-4.823-0.265-7.1l0.033-13.531A10.3,10.3,0,0,1,117.768,92.38Zm-0.033,35.914a13,13,0,0,1,1.557,1.649A32.583,32.583,0,0,0,123,132.67c4.641,2.826,10.311,4.468,16.23,5.991,4.214,1.085,8.7,1.412,13.282,2.222l5.565,0.5,7.187,0.336h5.267l3.246-.067,3.246-.1c2.542-.409,5.217-0.218,7.651-0.64l3.147-.336c3.074-.579,6.2-0.857,9.075-1.582a82.213,82.213,0,0,0,10-2.727,44.42,44.42,0,0,0,9.672-4.746,18.83,18.83,0,0,0,2.451-2.086,4.928,4.928,0,0,1,1.06-1.145l0.662,0.943a8.2,8.2,0,0,1,1.127,2.726L221.905,146c0,3.4.222,6.33-1.06,8.415-3.156,5.132-10.772,7.853-17.124,9.862-19.458,6.153-51.327,5.852-70.518-.27-6.093-1.943-13.175-4.628-16.23-9.592-1.282-2.084-1.06-5.015-1.06-8.415l0.033-14.036a8.241,8.241,0,0,1,1.126-2.726Z"/><path fill="#fff" d="M169.035,51.5c19.813,0,35.874,4.1,35.874,9.161s-16.061,9.161-35.874,9.161-35.874-4.1-35.874-9.161S149.222,51.5,169.035,51.5Z"/></g><g><path fill="#fff" d="M100.222,90.151c36.112,0,65.386,7.572,65.386,16.913,0,0.045-1.615,7.417-1.614,12.081,0,4.119,1.617,5.6,1.614,5.638-0.525,9.224-29.6,12.081-65.386,12.081s-64.864-1.246-65.387-10.47a15.785,15.785,0,0,0,1.614-7.249,66.788,66.788,0,0,0-1.614-12.081C34.835,97.723,64.11,90.151,100.222,90.151Z"/><path fill="#fff" d="M100.222,134.448c36.112,0,65.386,7.572,65.386,16.913,0,0.051-2.422,6.171-2.421,11.276,0,3.321,2.423,6.409,2.421,6.443-0.525,9.224-29.6,12.081-65.386,12.081s-64.864-1.246-65.387-10.47a16.227,16.227,0,0,0,2.422-8.054c0-5.117-2.422-11.231-2.422-11.276C34.835,142.02,64.11,134.448,100.222,134.448Z"/><path fill="#2e5468" d="M98.032,59.548c20.176-.091,38.92,2.093,53.244,7.978,5.646,2.319,12.4,5.509,14.739,11.037,1.091,2.58.58,7.937,0.58,11.491v10a26.324,26.324,0,0,1-.083,5,10.3,10.3,0,0,1-1.7,3.8c-4.123,5.809-12.821,8.913-20.453,11.284-23.645,7.348-63.088,7.609-87.029.29-8.111-2.48-17.981-5.869-21.944-12.318a9.9,9.9,0,0,1-1.2-3.059,21.793,21.793,0,0,1-.083-4.134V84.556c0-2.118-.092-4.292.5-5.787,1.781-4.523,6.273-7.166,10.475-9.3,5.3-2.692,11.377-4.451,17.8-6.076L70.416,61.9c3.136-.679,6.438-0.769,9.688-1.323l9.233-.744,3.561-.165Zm-0.7,11.078-3.188.083-8.695.537-6.293.7c-5.757,1.06-11.294,1.867-16.064,3.8-2.432.987-8.8,3.691-6.376,7.564,2.305,3.691,9.628,5.335,14.615,6.572,3.167,0.786,6.63,1.1,10.061,1.695L85.859,92l4.6,0.331a75.48,75.48,0,0,0,10.6.289c9.337,0,18.27-.572,26.084-2.273,4.985-1.085,9.78-2.059,13.58-4.3,1.5-.882,3.28-1.906,3.726-3.8a3.389,3.389,0,0,0-1.2-3.183c-1.887-1.894-4.52-2.944-7.329-3.927C125.2,71.38,111.7,70.646,97.328,70.626Zm-60.9,49.562c0.978,0.75,1.664,1.913,2.65,2.687a34.568,34.568,0,0,0,7.246,4.464,100.108,100.108,0,0,0,10.848,3.968c21.243,6.6,57.409,7.373,80.28,1.571,8.429-2.138,16.236-4.385,22.4-8.722a17.916,17.916,0,0,0,4.389-3.968l0.166,0.124,0.828,1.24a10.853,10.853,0,0,1,1.325,3.265q0.02,8.6.041,17.2c0,4.028.281,7.634-1.242,10.127-3.893,6.376-13.123,9.654-21.033,12.112-23.8,7.394-63.226,7.547-87.236.206-6.2-1.9-11.929-3.939-16.644-7.275a15.652,15.652,0,0,1-3.188-2.6,13.455,13.455,0,0,1-2.815-4.423c-0.714-2.259-.331-5.922-0.331-8.722q0.021-8.307.041-16.617A12.553,12.553,0,0,1,36.424,120.188Zm-0.041,44.105c0.587,0.24,1.387,1.575,1.946,2.025a40.8,40.8,0,0,0,4.637,3.349c5.8,3.47,12.889,5.486,20.288,7.357,5.267,1.332,10.871,1.735,16.6,2.729l6.956,0.62,8.985,0.413h6.583l4.058-.083,4.057-.124c3.177-.5,6.521-0.268,9.564-0.785l3.933-.414c3.843-.711,7.749-1.052,11.345-1.942,4.36-1.08,8.589-1.833,12.5-3.348,4.356-1.687,8.553-3.344,12.089-5.829a23.51,23.51,0,0,0,3.064-2.563,6.11,6.11,0,0,1,1.325-1.405l0.828,1.157a10,10,0,0,1,1.408,3.349q0.02,8.618.041,17.237c0,4.176.278,7.773-1.325,10.333-3.945,6.3-13.464,9.645-21.4,12.112-24.322,7.556-64.158,7.187-88.147-.331-7.616-2.387-16.469-5.684-20.287-11.781-1.6-2.559-1.325-6.158-1.325-10.333L34.147,168.8a10.032,10.032,0,0,1,1.408-3.349Z"/><path fill="#fff" d="M100.615,70.022c24.293,0,43.986,5.047,43.986,11.273s-19.693,11.273-43.986,11.273S56.629,87.521,56.629,81.3,76.323,70.022,100.615,70.022Z"/></g></svg>';
App.Modules.Sites.Icons.ContextMenuStorageIcon =        '<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.24542 1.61621C11.3136 1.60689 13.2349 1.83076 14.7032 2.434C15.2819 2.67171 15.9743 2.9987 16.214 3.56535C16.3258 3.82981 16.2735 4.37893 16.2735 4.74323V5.76828C16.2869 5.939 16.2841 6.11062 16.265 6.2808C16.234 6.42115 16.1747 6.5537 16.0907 6.67032C15.6681 7.26577 14.7765 7.58395 13.9942 7.82699C11.5704 8.58019 7.52733 8.60695 5.07326 7.85671C4.24185 7.6025 3.23012 7.25511 2.8239 6.59406C2.76571 6.49712 2.72414 6.39114 2.70089 6.2805C2.68463 6.13983 2.68178 5.99794 2.69238 5.85674V4.17966C2.69238 3.96255 2.68295 3.73971 2.74363 3.58646C2.92619 3.12283 3.38665 2.85191 3.81737 2.63317C4.36065 2.35722 4.98357 2.17692 5.64196 2.01035L6.41464 1.85731C6.7361 1.78771 7.07457 1.77848 7.40771 1.72169L8.35414 1.64543L8.71916 1.62852L9.24542 1.61621ZM9.17367 2.75176L8.84688 2.76027L7.9556 2.81532L7.31054 2.88707C6.72041 2.99573 6.15285 3.07845 5.6639 3.27659C5.4146 3.37776 4.76185 3.65493 5.01033 4.05194C5.2466 4.43028 5.99724 4.5988 6.50843 4.7256C6.83307 4.80617 7.18804 4.83835 7.53974 4.89935L7.99763 4.9427L8.46915 4.97663C8.83019 5.01197 9.19327 5.02187 9.5557 5.00626C10.5128 5.00626 11.4285 4.94762 12.2294 4.77326C12.7404 4.66205 13.2319 4.56221 13.6215 4.33249C13.7752 4.24208 13.9577 4.13712 14.0034 3.94297C14.0135 3.88257 14.0074 3.82058 13.9858 3.76329C13.9642 3.70599 13.9278 3.65542 13.8804 3.6167C13.687 3.42256 13.4171 3.31493 13.1291 3.21416C12.0303 2.82905 10.6465 2.75381 9.17326 2.75176H9.17367ZM2.93112 7.83211C3.03136 7.90899 3.10168 8.0282 3.20275 8.10754C3.43054 8.29008 3.68002 8.44377 3.9455 8.56513C4.30802 8.72199 4.6793 8.8578 5.05748 8.97187C7.23499 9.6484 10.9422 9.72763 13.2866 9.1329C14.1506 8.91375 14.9508 8.68342 15.5827 8.23885C15.7542 8.12914 15.9062 7.99169 16.0326 7.83211L16.0496 7.84482L16.1345 7.97193C16.1977 8.07535 16.2435 8.18839 16.2703 8.30661C16.2717 8.8943 16.2731 9.482 16.2745 10.0697C16.2745 10.4826 16.3033 10.8522 16.1472 11.1078C15.7481 11.7613 14.802 12.0973 13.9912 12.3493C11.5516 13.1072 7.51022 13.1229 5.04907 12.3704C4.41354 12.1757 3.82629 11.9666 3.34298 11.6247C3.2228 11.5506 3.11292 11.461 3.01619 11.3582C2.89121 11.2274 2.79317 11.0734 2.72764 10.9048C2.65445 10.6732 2.69371 10.2978 2.69371 10.0108C2.69515 9.44308 2.69655 8.8753 2.69792 8.30743C2.74162 8.1346 2.82075 7.97274 2.9303 7.83211H2.93112ZM2.92691 12.3531C2.98708 12.3777 3.06909 12.5145 3.12639 12.5607C3.2766 12.6861 3.43543 12.8008 3.6017 12.904C4.19623 13.2596 4.92289 13.4663 5.68132 13.6581C6.22122 13.7946 6.79565 13.8359 7.3829 13.9378L8.09593 14.0014L9.01694 14.0437H9.69173L10.1077 14.0352L10.5236 14.0225C10.8492 13.9712 11.192 13.995 11.5039 13.942L11.9071 13.8996C12.301 13.8267 12.7014 13.7917 13.07 13.7005C13.5169 13.5898 13.9504 13.5126 14.3513 13.3573C14.7978 13.1844 15.228 13.0146 15.5905 12.7598C15.7024 12.6813 15.8075 12.5934 15.9046 12.4971C15.9419 12.4422 15.9877 12.3936 16.0404 12.3531L16.1252 12.4717C16.1939 12.5763 16.2428 12.6927 16.2696 12.815C16.2709 13.4039 16.2723 13.9929 16.2738 14.5819C16.2738 15.0099 16.3023 15.3786 16.138 15.641C15.7336 16.2868 14.7578 16.6297 13.9443 16.8826C11.4512 17.6571 7.36784 17.6193 4.90885 16.8486C4.12817 16.604 3.22069 16.266 2.82933 15.641C2.66532 15.3787 2.69351 15.0098 2.69351 14.5819L2.69689 12.8151C2.72371 12.6928 2.77262 12.5765 2.84122 12.4718L2.92691 12.3531Z" fill="white"/></svg>';

const Sites = new App.Modules.Sites();
