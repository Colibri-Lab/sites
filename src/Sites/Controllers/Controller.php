<?php


namespace App\Modules\Sites\Controllers;


use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\IO\FileSystem\File;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Debug;
use Colibri\Utils\ExtendedObject;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\View;
use ScssPhp\ScssPhp\Compiler;
use ScssPhp\ScssPhp\OutputStyle;

/**
 * Default controller
 */
class Controller extends WebController
{

    /**
     * Default action
     * @param RequestCollection $get data from get request
     * @param RequestCollection $post a request post data
     * @param mixed $payload payload object in POST/PUT request
     * @return object
     */
    public function Index(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        $module = App::$moduleManager->tools;

        // создаем обьект View
        $view = View::Create();

        // создаем обьект шаблона
        $template = PhpTemplate::Create($module->modulePath . 'templates/index');

        // собираем аргументы
        $args = new ExtendedObject([
            'get' => $get,
            'post' => $post,
            'payload' => $payload
        ]);

        try {
            // пробуем запустить генерацию html
            $html = $view->Render($template, $args);
        } catch (\Throwable $e) {
            // если что то не так то выводим ошибку
            $html = $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine();
        }

        // финишируем контроллер
        return $this->Finish(
            200,
            $html,
            [],
            'utf-8',
            [
                'tab_key' => 'tools-list',
                'tab_type' => 'tab',
                'tab_title' => 'Colibri Sites Module',
                'tab_color' => 'orange',
                'tab_header' => 'Colibri Sites Module',
            ]
        );
    }

    /**
     * Returns a bundle for integrate to other colibri sites
     *
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param \stdClass|null $payload
     * @return \stdClass
     * @throws \App\Modules\Sites\Exception
     */
    public function Bundle(RequestCollection $get, RequestCollection $post, ?\stdClass $payload): object
    {

        App::$instance->HandleEvent(EventsContainer::BundleComplete, function ($event, $args) {
            if (in_array('scss', $args->exts)) {
                try {
                    $scss = new Compiler();
                    $scss->setOutputStyle(OutputStyle::EXPANDED);
                    $args->content = $scss->compileString($args->content)->getCss();
                } catch (\Exception $e) {
                    Debug::Out($e->getMessage());
                }
            }
            return true;
        });

        App::$instance->HandleEvent(EventsContainer::BundleFile, function ($event, $args) {

            $file = new File($args->file);
            if ($file->extension == 'html') {
                // компилируем html в javascript
                $componentName = $file->filename;
                $res = preg_match('/ComponentName="([^"]*)"/i', $args->content, $matches);
                if ($res > 0) {
                    $componentName = $matches[1];
                }
                $compiledContent = str_replace('\'', '\\\'', str_replace("\n", "", str_replace("\r", "", $args->content)));
                $compiledContent = str_replace('ComponentName="' . $componentName . '"', 'namespace="' . $componentName . '"', $compiledContent);
                $args->content = 'Colibri.UI.AddTemplate(\'' . $componentName . '\', \'' . $compiledContent . '\');' . "\n";
            }
        });

        $jsBundle = Bundle::Automate(App::$domainKey, 'assets.bundle.js', 'js', [
            ['path' => App::$moduleManager->Sites->modulePath . '.Bundle/', 'exts' => ['js', 'html']],
        ]);
        $cssBundle = Bundle::Automate(
            App::$domainKey,
            'assets.bundle.css',
            'scss',
            array(
                ['path' => App::$moduleManager->Sites->modulePath . '.Bundle/'],
            )
        );

        return $this->Finish(
            200,
            'Bundle created successfuly',
            (object) [
                'js' => str_replace('http://', 'https://', App::$request->address) . $jsBundle,
                'css' => str_replace('http://', 'https://', App::$request->address) . $cssBundle
            ],
            'utf-8'
        );
    }
}