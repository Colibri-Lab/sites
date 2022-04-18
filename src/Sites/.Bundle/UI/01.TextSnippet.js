App.Modules.Sites.UI.TextSnippet = class extends Colibri.UI.Pane {

    constructor(name, container) {
        super(name, container);

        this.AddClass('app-component-textsnippet');



    }

    set value(value) {
        this._value = value;
        this._setValue();
    }

    get value() {
        return this._value;
    }

    _setValue() {
        console.log(this._value);
        this.GenerateChildren(this._value);
    }

}