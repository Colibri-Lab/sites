<?php

namespace App\Modules\Sites\Models\Fields\Domains;

/**
 * Enum {"ru":"\u0422\u0438\u043f \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f","en":"Application type","hy":"\u0551\u0580\u0561\u0563\u0580\u056b \u057f\u0565\u057d\u0561\u056f\u0565","it":"Tipo di applicazione","es":"Tipo de aplicaci\u00f3n"}
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Domains
 */
enum AdditionalSettingsTypeEnum:string 
{

    public const JsonSchema = [
        'type' => 'string',
        'enum' => [
            # region Values:
			"application",
			"website"
			 # endregion Values;
        ]
    ];

    # region Properties:
	/** 
	 * @ru: Приложение (javascript)
	 * @en: Application (javascript)
	 * @hy: Ցրագիր (javascript)
	 * @it: Applicazione (javascript)
	 * @es: Aplicación (javascript)
	 */
	case Application = 'application';
	/** 
	 * @ru: Обычный вебсайт (php/js)
	 * @en: Website (php/js)
	 * @hy: Վեբսայտ (javascript)
	 * @it: Sito web (php/js)
	 * @es: Sitio web (php/js)
	 */
	case Website = 'website';	
	# endregion Properties;

}