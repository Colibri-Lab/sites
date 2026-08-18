/**
 * TextSnippet component
 * @class
 * @extends Colibri.UI.Pane
 * @memberof App.Modules.Sites.UI
 */
App.Modules.Sites.UI.TextSnippet = class extends Colibri.UI.Pane {

    /**
     * @constructor
     * @param {string} name - The name of the component
     * @param {Colibri.UI.Pane} container - The container of the component
     */
    constructor(name, container) {
        super(name, container);

        this.AddClass('app-component-textsnippet');

    }

    /**
     * Value of object
     * @type {string}
     */
    set value(value) {
        this._value = value;
        this._setValue();
    }

    /**
     * Value of object
     * @type {string}
     */
    get value() {
        return this._value;
    }

    /**
     * @ignore
     * @private
     */
    _setValue() {
        this.GenerateChildren('<dummy>' + this._value + '</dummy>');
    }

}