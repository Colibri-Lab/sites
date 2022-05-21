<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\Web\Controller;


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
 * @property string $html Содержание
 * endregion Properties;
 */
class Text extends BaseModelDataRow {

    public function Delete(): QueryInfo
    {
        // удаляем все публикации
        Publications::DeleteAllByRow($this);
        return parent::Delete();    
    }

    public function ClearHtmlText(string $field, string $linkControllerClass, string $linkMethod): string
    {
        $text = $this->$field;

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

}