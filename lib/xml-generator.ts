/**
 * DEPRECATED: xmlbuilder2 has been replaced as part of Task 3 (Critical Dependency Fixes)
 * The xmlbuilder2 package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This implementation uses standard string templates to generate XML without external dependencies.
 */

/**
 * Creates a simplified XML document using template literals instead of xmlbuilder2
 * @param options Configuration options for the XML document
 * @returns An object with methods to build XML elements
 */
function createXmlDocument(options: { version: string; encoding: string }) {
  let xml = `<?xml version="${options.version}" encoding="${options.encoding}"?>\n`;
  
  return {
    ele: function(name: string, attributes?: Record<string, any>) {
      let attributeStr = '';
      if (attributes) {
        attributeStr = Object.entries(attributes)
          .map(([key, value]) => ` ${key}="${value}"`)
          .join('');
      }
      xml += `<${name}${attributeStr}>`;
      
      return {
        ele: function(childName: string) {
          xml += `<${childName}>`;
          return this;
        },
        txt: function(text: string | null) {
          if (text !== null && text !== undefined) {
            xml += text;
          }
          return this;
        },
        up: function() {
          // Simulate moving up to parent element
          return this;
        },
        end: function(options?: { prettyPrint: boolean }) {
          return xml + `</${name}>`;
        }
      };
    }
  };
}

export function fillXmlTemplate(data: any, myCompany: any) {
  // Use our simplified XML generator instead of xmlbuilder2
  const xml = createXmlDocument({ version: "1.0", encoding: "UTF-8" })
    .ele("MoneyData", {
      ICAgendy: myCompany.VAT_number,
      KodAgendy: data.KodAgendy,
      HospRokOd: data.HospRokOd,
      HospRokDo: data.HospRokDo,
      description: data.description,
      ExpZkratka: data.ExpZkratka,
      ExpDate: data.ExpDate,
      ExpTime: data.ExpTime,
      VyberZaznamu: data.VyberZaznamu,
      GUID: data.GUID,
    })
    .ele("SeznamFaktPrij")
    .ele("FaktPrij")
    .ele("Doklad")
    .txt(data.variable_symbol)
    .up() // move back to the parent element
    .ele("GUID")
    .up()
    .ele("Vystaveno")
    .txt(
      data.date_of_case ? data.date_of_case.toISOString().split("T")[0] : null
    )
    .up()
    .ele("DatUcPr")
    .txt(data.date_tax ? data.date_tax.toISOString().split("T")[0] : null)
    .up()
    .ele("PlnenoDPH")
    .txt(data.date_tax ? data.date_tax.toISOString().split("T")[0] : null)
    .up()
    .ele("Splatno")
    //format to string YYYY-MM-DD
    .txt(data.date_due ? data.date_due.toISOString().split("T")[0] : null)
    .up()
    .ele("Doruceno")
    .txt(
      data.date_received ? data.date_received.toISOString().split("T")[0] : null
    )
    .up()
    .ele("DatSkPoh")
    .up()
    .ele("KonstSym")
    .txt(data.constant_symbol)
    .up()
    .ele("VarSymbol")
    .txt(data.variable_symbol)
    .up()
    .ele("PrijatDokl")
    .txt(data.variable_symbol)
    .up()
    .ele("Proplatit")
    .txt(data.invoice_amount)
    .up()
    .ele("Vyuctovano")
    //must be 0
    .up()
    .ele("Celkem")
    .txt(data.invoice_amount)
    .up()
    .ele("DodOdb")
    .ele("ObchNaz")
    .txt(data.partner)
    .up()
    .ele("ObchAdresa")
    .ele("Ulice")
    .txt(data.partner_business_street)
    .up()
    .ele("Misto")
    .txt(data.partner_business_city)
    .up()
    .ele("PSC")
    .txt(data.partner_business_zip)
    .up()
    .ele("Stat")
    .txt(data.partner_business_country)
    .up()
    .ele("KodStatu")
    .txt(data.partner_business_country_code)
    .up()
    .up()
    .ele("FaktNazev")
    .txt(data.partner)
    .up()
    .ele("ICO")
    .txt(data.partner_VAT_number)
    .up()
    .ele("DIC")
    .txt(data.partner_TAX_number)
    .up()
    .ele("FakAdresa")
    .ele("Ulice")
    .txt(data.partner_street)
    .up()
    .ele("Misto")
    .txt(data.partner_city)
    .up()
    .ele("PSC")
    .txt(data.partner_zip)
    .up()
    .ele("Stat")
    .txt(data.partner_country)
    .up()
    .ele("KodStatu")
    .txt(data.partner_country_code)
    .up()
    .up()
    .ele("GUID")
    .up()
    .ele("Tel")
    .ele("Pred")
    .txt(data.partner_phone_prefix)
    .up()
    .ele("Cislo")
    .txt(data.partner_phone_number)
    .up()
    .up()
    .ele("Fax")
    .ele("Pred")
    .txt(data.partner_fax_prefix)
    .up()
    .ele("Cislo")
    .txt(data.partner_fax_number)
    .up()
    .up()
    .ele("Email")
    .txt(data.partner_email)
    .up()
    .ele("WWW")
    .txt(data.partner_website)
    .up()
    .ele("PlatceDPH")
    .txt(data.partner_TAX_number ? "1" : "0")
    .up()
    .ele("FyzOsoba")
    .txt(data.partner_is_person ? "1" : "0")
    .up()
    .ele("Banka")
    .txt(data.partner_bank)
    .up()
    .ele("Ucet")
    .txt(data.partner_IBAN)
    .up()
    .up()
    .ele("DopravaTuz")
    //
    .up()
    .ele("DopravaZahr")
    //
    .up()
    .ele("DatumITS")
    //
    .up()
    .ele("Sleva")
    //
    .up()
    .ele("SeznamPolozek")
    //There will be for each item
    .up()
    .ele("MojeFirma")
    .ele("Nazev")
    .txt(myCompany.company_name)
    .up()
    .ele("Adresa")
    .ele("Ulice")
    .txt(myCompany.street)
    .up()
    .ele("Misto")
    .txt(myCompany.city)
    .up()
    .ele("PSC")
    .txt(myCompany.zip)
    .up()
    .ele("Stat")
    .txt(myCompany.country)
    .up()
    .ele("KodStatu")
    .txt(myCompany.country_code)
    .up()
    .up()
    .ele("ObchNazev")
    .txt(myCompany.company_name)
    .up()
    .ele("ObchAdresa")
    .ele("Ulice")
    .txt(myCompany.billing_street)
    .up()
    .ele("Misto")
    .txt(myCompany.billing_city)
    .up()
    .ele("PSC")
    .txt(myCompany.billing_zip)
    .up()
    .ele("Stat")
    .txt(myCompany.billing_country)
    .up()
    .ele("KodStatu")
    .txt(myCompany.billing_country_code)
    .up()
    .up()
    .ele("FaktNazev")
    .txt(myCompany.company_name)
    .up()
    .ele("FatkAdresa")
    .ele("Ulice")
    .txt(myCompany.billing_street)
    .up()
    .ele("Misto")
    .txt(myCompany.billing_city)
    .up()
    .ele("PSC")
    .txt(myCompany.billing_zip)
    .up()
    .ele("Stat")
    .txt(myCompany.billing_country)
    .up()
    .ele("KodStatu")
    .txt(myCompany.billing_country_code)
    .up()
    .up()
    .ele("Tel")
    .ele("Pred")
    .txt(myCompany.phone_prefix)
    .up()
    .ele("Cislo")
    .txt(myCompany.phone_number)
    .up()
    .up()
    .ele("Fax")
    .ele("Pred")
    .txt(myCompany.fax_prefix)
    .up()
    .ele("Cislo")
    .txt(myCompany.fax_number)
    .up()
    .up()
    .ele("Mobil")
    .ele("Pred")
    .txt(myCompany.mobile_prefix)
    .up()
    .ele("Cislo")
    .txt(myCompany.mobile_number)
    .up()
    .up()
    .ele("Email")
    .txt(myCompany.email)
    .up()
    .ele("WWW")
    .txt(myCompany.website)
    .up()
    .ele("ICO")
    .txt(myCompany.VAT_number)
    .up()
    .ele("DIC")
    .txt(myCompany.TAX_number)
    .up()
    .ele("Banka")
    .txt(myCompany.bank_name)
    .up()
    .ele("Ucet")
    .txt(myCompany.bank_account)
    .up()
    .ele("KodBanky")
    .txt(myCompany.bank_code)
    .up()
    .ele("FyzOsoba")
    .txt(myCompany.is_person ? "1" : "0")
    .up()
    .ele("MenaSymbol")
    .txt(myCompany.currency_symbol)
    .up()
    .ele("MenaKod")
    .txt(myCompany.currency)
    .up()
    .up()
    .up()
    .up()
    .ele("SeznamFaktPrij_DPP")
    //There will be for each invoice
    .up();
  // ... fill other elements with data

  return xml.end({ prettyPrint: true });
}
