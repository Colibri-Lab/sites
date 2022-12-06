<?php

namespace App\Modules\Sites\Models;

# region Uses:
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Fields\ValueField;
use Colibri\Data\Storages\Fields\ObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
# endregion Uses;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\App;

/**
 * Представление строки в таблице в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property ValueField|null $name #{sites-storages-domains-key;Ключ домена}
 * @property string|null $description Описание страницы
 * @property bool|null $closed Закрыт
 * @property ObjectField|null $additional Дополнительные параметры
 * @property ParametersField|null $parameters 
 * endregion Properties;
 */
class Domain extends BaseModelDataRow {

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'name',
			'description',
			'closed',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'date-time'],
            # region SchemaProperties:
			'name' => ['type' => 'string', 'enum' => []],
			'description' => ['type' => 'string', 'maxLength' => 255],
			'closed' => ['type' => 'boolean', 'enum' => ['0', '1'],],
			'additional' => ['type' => 'object', 'required' => [], 'properties' => ['meta' => ['type' => 'object', 'required' => [], 'properties' => ['title' => ['type' => ['string', 'null'], 'maxLength' => 512],'description' => ['type' => ['string', 'null'], 'maxLength' => 1024],'keywords' => ['type' => ['string', 'null'], 'maxLength' => 1024],]],'settings' => ['type' => 'object', 'required' => ['type','module','component','template',], 'properties' => ['type' => ['type' => 'string', 'enum' => ['application', 'website']],'module' => ['type' => 'string', 'maxLength' => 255],'component' => ['type' => 'string', 'maxLength' => 255],'template' => ['type' => 'string', 'maxLength' => 255],]],'parameters' => ['type' => 'array', 'items' => ['type' => 'object', 'required' => [], 'properties' => ['name' => ['type' => ['string', 'null'], 'maxLength' => 50],'description' => ['type' => ['string', 'null'], 'maxLength' => 255],'type' => ['type' => ['string', 'null'], 'maxLength' => 20],'length' => ['type' => ['integer', 'null'], ],'default' => ['type' => ['string', 'null'], 'maxLength' => 255],'class' => ['type' => ['string', 'null'], 'maxLength' => 255],'component' => ['type' => ['string', 'null'], 'maxLength' => 255],]]],]],
			'parameters' => ParametersField::JsonSchema,
			# endregion SchemaProperties;
        ]
    ];

    public function Delete(): QueryInfo
    {
        Pages::DeleteAllByDomain($this);
        return parent::Delete();
    }

    public function Template(): ?string
    {
        return $this->additional?->settings?->template;
    }
    
    public function Component(): ?string
    {
        return $this->additional?->settings?->component;
    }

    public function GetMeta(): object
    {
        $meta = $this->additional->meta;
        $meta->canonical = $this->Url();
        return $meta;
    }
    
    public function Url(array $params = []): string
    {
        $uri = StringHelper::AddToQueryString('/', $params, true);
        return App::$router->Uri($uri);
    }

}