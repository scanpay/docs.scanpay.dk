using System;
using Scanpay;
using System.Collections.Generic;

namespace Scanpay_Example
{
    class Program
    {
        static void Main(string[] args)
        {
            string apiKey = "Your scanpay API Key";

            var client = new Client(apiKey);

            var data = new NewURLReq
            {
                orderid = "a766409",
                language = "da",
                successurl = "https://din-shop.dk/success",
                items = new Scanpay.Item[]
                {
                    new Item
                    {
                        name = "Pink Floyd: The Dark Side Of The Moon",
                        total = "199.98 DKK",
                        quantity = 2,
                        sku = "fadf23"
                    },
                    new Item
                    {
                        name = "巨人宏偉的帽子",
                        quantity = 2,
                        total = "840 DKK",
                        sku = "124"
                    }
                },
                billing = new Billing
                {
                    name = "John Doe",
                    company = "The Shop A/S",
                    email = "john@doe.com",
                    phone = "+4512345678",
                    address = new string[] { "Langgade 23, 2. th" },
                    city = "Havnby",
                    zip = "1234",
                    state = "",
                    country = "DK",
                    vatin = "35413308",
                    gln = "7495563456235"
                },
                shipping = new Shipping
                {
                    name = "John Doe",
                    company = "The Shop A/S",
                    email = "john@doe.com",
                    phone = "+4512345678",
                    address = new string[] { "Langgade 23, 2. th" },
                    city = "Havnby",
                    zip = "1234",
                    state = "",
                    country = "DK"
                }
            };

            Options options = new Options();

            Dictionary<string, string> headers = new Dictionary<string, string>();
            headers.Add("X-Cardholder-IP", "189.127.159.146");

            options.headers = headers;

            try
            {
                var url = client.newURL(data, options);
                Console.WriteLine("Payment URL: {0}", url);
            } 
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
