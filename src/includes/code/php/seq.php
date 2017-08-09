$apikey = 'Your scanpay API key';
$scanpay = new Scanpay\Scanpay($apikey);

$options = [
    'auth'  =>  $apikey, // Set an API key for this request (optional)
];

try {
    print_r ($seq = $scanpay->seq(0, $options));
} catch (Exception $e) {
    die('Caught Scanpay client exception: ' . $e->getMessage() . "\n");
}