<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\Web\Controller;
use Colibri\Xml\XmlNode;
use Colibri\Utils\Debug;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\Templates\Template;
use Colibri\Utils\ExtendedObject;


/**
 * Представление строки в таблице в хранилище Тексты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property string|null $title Заголовок
 * @property string $html Содержание блока
 * endregion Properties;
 */
class Text extends BaseModelDataRow {

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'html',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'title' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'html' => ['type' => 'string', ],
			# endregion SchemaProperties;
        ]
    ];

    public function Delete(): QueryInfo
    {
        // удаляем все публикации
        Publications::DeleteAllByRow($this);
        return parent::Delete();    
    }

    public static function ClearHtmlText(string $text, string $linkControllerClass, string $linkMethod): string
    {

        $text = StringHelper::StripHtmlAndBody($text);
        if($text == '') {
            return '';
        }

        $text = str_replace(
            '<a ',
            '<a rel="nofollow" target="_blank" ',
            preg_replace_callback(
                '/href="(https?\:\/\/[^\"\']+)/im',
                function ($v) use ($linkControllerClass, $linkMethod) {
                    $v1 = explode('.', $v[1]);
                    if (in_array(end($v1), array('jpg','png','gif','jpeg','avi','mpg'))) {
                        return 'href="'.$v[1];
                    }
                    try {
                        $ret = 'href="'.$linkControllerClass::GetEntryPoint($linkMethod, 'json', ['url' => bin2hex($v[1])]);
                    } catch (\Throwable $e) {
                        $ret = 'href="'.$v[1];
                    }
                    return $ret;
                },
                StringHelper::AddNoIndex(
                    preg_replace(
                        array('/itemprop=[\'\"?]([^\'\"]*?)[\'\"?]/im', '/itemtype=[\'\"?]([^\'\"]*?)[\'\"?]/im', '/itemscope=[\'\"?]([^\'\"]*?)[\'\"?]/im'),
                        '',
                        $text
                    ),
                    true,
                    ''
                )
            )
        );

        $text = preg_replace('/srcset="([^"]*)"/', '', $text);

        return $text;
        
    }

    public static function ApplyComponents(string $text, Template $parent, string $snippetsPath, ExtendedObject $args): string
    {
        $xml = XmlNode::LoadHtmlNode($text, 'utf-8');
        $components = $xml->Query('//component');
        foreach($components->getIterator() as $component) {
            /** @var XmlNode $component */

            $args = $args->GetData();
            foreach($component->attributes as $attr) {
                if(!in_array($attr->name, ['component', 'contenteditable', 'style', 'shown'])) {
                    $args[$attr->name] = $attr->value;
                }
            }
            
            $template = $component->attributes->component->value;
            $content = $parent->Insert($snippetsPath.$template, $args);
            if(!$content) {
                $component->Remove();
            }
            else {
                $newNode = XmlNode::LoadHtmlNode($content, 'utf-8');
                $component->ReplaceTo($newNode);
            }

        }

        $html = $xml->html;
        $html = StringHelper::StripHtmlAndBody($html);
        $html = StringHelper::StripHtmlAndBody($html);
        return $html;
    }

}