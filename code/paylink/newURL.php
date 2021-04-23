$apikey = 'Your scanpay API key';
$scanpay = new Scanpay\Scanpay($apikey);

$order = [
    'orderid'    => 'a766409',
    'language'   => 'da',
    'successurl' => 'https://din-shop.dk/success',
    'items'    => [
        [
            'name'     => 'Pink Floyd: The Dark Side Of The Moon',
            'quantity' => 2,
            'total'    => '199.98 DKK',
            'sku'      => 'fadf23',
        ],
        [
            'name'     => 'Økologisk æblekage',
            'quantity' => 2,
            'total'    => '840 DKK',
            'sku'      => '124',
        ],
    ],
    'billing'  => [
        'name'    => 'John Doe',
        'company' => 'The Shop A/S',
        'email'   => 'john@doe.com',
        'phone'   => '+4512345678',
        'address' => ['Langgade 23, 2. th'],
        'city'    => 'Havneby',
        'zip'     => '1234',
        'state'   => '',
        'country' => 'DK',
        'vatin'   => '35413308',
        'gln'     => '7495563456235',
    ],
    'shipping' => [
        'name'    => 'Jan Dåh',
        'company' => 'The Choppa A/S',
        'email'   => 'jan@doh.com',
        'phone'   => '+4587654321',
        'address' => ['Langgade 23, 1. th', 'C/O The Choppa'],
        'city'    => 'Haveby',
        'zip'     => '1235',
        'state'   => '',
        'country' => 'DK',
    ],
];

$options = [
    'headers' => [
        'X-Cardholder-IP: ' . $_SERVER['REMOTE_ADDR'],
    ]
];

try {
    print_r ($URL = $scanpay->newURL($order, $options));
} catch (Exception $e) {
    die('Caught Scanpay client exception: ' . $e->getMessage() . "\n");
}
