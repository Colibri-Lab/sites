<?php

use Colibri\App;
use App\Modules\Sites\Models\Domains;
use Colibri\Web\View;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Utils\ExtendedObject;
$domain = Domains::LoadByName(App::$domainKey);

$type = $domain?->additional?->settings?->type?->value;
$module = $domain?->additional?->settings->module;
if($type === 'website') {
    // тут надо запустить index-ный шаблон модуля

    $moduleObject = App::$moduleManager->$module;

    // создаем обьект шаблона
    $template = PhpTemplate::Create($moduleObject->modulePath . '/templates/web/body');

    // собираем аргументы
    $args = new ExtendedObject([
        'get' => App::$request->get,
        'post' => App::$request->post,
        'payload' => App::$request->GetPayloadCopy()
    ]);

    // пытаемся сгенерировать страницу
    echo $template->Render($args);

}

?>