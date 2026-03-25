import type { ToolEntry } from "@/config/toolRegistry"

export const toolTranslationsTr: Record<string, { label: string; description: string }> = {
  // Dev Tools
  "tree": { label: "Ağaç Oluşturucu", description: "Girintili metin girdisinden ASCII ağaç yapıları oluşturun" },
  "db-model": { label: "VT Modeli", description: "DBML kullanarak görsel ER diyagramlarıyla veritabanı şemaları tasarlayın" },
  "json": { label: "JSON", description: "JSON verilerini sözdizimi vurgulama ile biçimlendirin, doğrulayın ve düzenleyin" },
  "regex": { label: "Regex", description: "Canlı eşleştirme ile düzenli ifadeleri test edin ve hata ayıklayın" },
  "api": { label: "API", description: "REST API istekleri oluşturun ve yanıt önizlemesiyle test edin" },
  "markdown": { label: "Markdown", description: "Markdown yazın ve işlenmiş çıktıyı canlı olarak önizleyin" },
  "sql-formatter": { label: "SQL Biçimlendirici", description: "SQL sorgularını lehçe desteğiyle biçimlendirin, güzelleştirin ve küçültün" },
  "text-diff": { label: "Metin Karşılaştırma", description: "İki metni yan yana veya satır içi olarak vurgulanan farklarla karşılaştırın" },
  "json-to-types": { label: "JSON'dan Tür Oluşturucu", description: "JSON'dan TypeScript, Dart, C#, Python ve Java türleri oluşturun" },
  "cron": { label: "Cron Oluşturucu", description: "Cron ifadelerini görsel olarak oluşturun, açıklamaları ve sonraki çalışma zamanlarını görün" },
  "http-status": { label: "HTTP Durum Kodları", description: "Aranabilir HTTP durum kodları referansı, istek/yanıt örnekleriyle" },
  "chmod": { label: "Chmod Hesaplayıcı", description: "Sayısal ve sembolik gösterimle Unix dosya izinlerini hesaplayın" },
  "env-editor": { label: ".env Düzenleyici", description: ".env dosyalarını maskeli değerlerle görüntüleyin, düzenleyin, karşılaştırın ve dışa aktarın" },
  "git-builder": { label: "Git Oluşturucu", description: "Git komutlarını bayraklar, seçenekler ve yaygın tariflerle görsel olarak oluşturun" },
  "code-screenshot": { label: "Kod Ekran Görüntüsü", description: "Özel arka planlar ve pencere çerçevesiyle güzel kod ekran görüntüleri oluşturun" },

  // Converters
  "encoder": { label: "Kodlayıcı", description: "Metni Base64, URL ve diğer formatlarda kodlayın ve çözün" },
  "timestamp": { label: "Zaman Damgası", description: "Unix zaman damgaları ile okunabilir tarihler arasında dönüştürme yapın" },
  "base64-to-file": { label: "Base64'ten Dosyaya", description: "Base64 dizelerini önizleme ve indirme desteğiyle dosyalara dönüştürün" },
  "yaml-json": { label: "YAML ↔ JSON", description: "YAML ve JSON formatları arasında gerçek zamanlı dönüştürme yapın" },
  "number-base": { label: "Sayı Tabanı", description: "İkili, sekizli, onlu ve onaltılı arasında bit görselleştirmesiyle dönüştürme yapın" },
  "unit-converter": { label: "Birim Dönüştürücü", description: "Uzunluk, ağırlık, sıcaklık, veri boyutu, zaman ve hız birimleri arasında dönüştürün" },
  "color-format": { label: "Renk Formatı", description: "HEX, RGB, HSL, HSB ve CMYK arasında canlı önizlemeyle renk dönüştürün" },

  // Generators
  "qr-code": { label: "QR Kod", description: "Özel renkler, nokta tipleri ile stilize QR kodlar oluşturun ve PNG olarak indirin" },
  "uuid": { label: "UUID", description: "UUID v1, v4 ve v7'yi toplu oluşturma ve format seçenekleriyle üretin" },
  "lorem-ipsum": { label: "Lorem Ipsum", description: "Paragraf, cümle veya kelime olarak yer tutucu metin oluşturun" },
  "jwt": { label: "JWT", description: "Mevcut JWT'leri çözün veya özel başlık ve yüklerle yeni tokenlar oluşturun" },
  "fake-data": { label: "Sahte Veri", description: "Sahte isimler, e-postalar, adresler ve özel JSON veri setleri oluşturun" },
  "hash": { label: "Hash Oluşturucu", description: "Metin veya dosyalardan MD5, SHA-1, SHA-256 ve SHA-512 hash'leri oluşturun" },
  "slug": { label: "Slug Oluşturucu", description: "Metni transliterasyon desteğiyle URL dostu slug'lara dönüştürün" },

  // Design
  "colors": { label: "Renkler", description: "Renk paletleri oluşturun ve uyum analiziyle keşfedin" },
  "board": { label: "Tahta", description: "Serbest çizim tahtasında çizim yapın ve tasarlayın" },
  "shapemaker": { label: "Şekil Oluşturucu", description: "Figma benzeri düzenleyiciyle özel şekiller çizin ve Flutter/Dart CustomPainter kodu olarak dışa aktarın" },
  "mockup": { label: "Mockup", description: "Ekran görüntülerini cihaz çerçevelerine yerleştirin ve cilalı mockup'ları PNG olarak dışa aktarın" },
  "timeline": { label: "Zaman Çizelgesi", description: "Öncelik tabanlı veya tarih tabanlı görselleştirmeyle proje zaman çizelgeleri oluşturun" },
  "gradient": { label: "Gradyan Oluşturucu", description: "Görsel kontroller ve hazır galeriyle CSS ve Flutter gradyanları oluşturun" },
  "box-shadow": { label: "Kutu Gölgesi", description: "Çoklu katman ve canlı önizlemeyle CSS ve Flutter kutu gölgeleri oluşturun" },
  "icon-editor": { label: "İkon Düzenleyici", description: "Lucide ikonlarını göz atın, özelleştirin ve SVG, PNG, React veya Flutter kodu olarak dışa aktarın" },

  // Network
  "dns-lookup": { label: "DNS Sorgusu", description: "Birden fazla sağlayıcı üzerinden DNS sorgusu yapın" },
  "whats-my-ip": { label: "IP Adresim", description: "IP adresinizi ve konum bilgilerinizi görüntüleyin" },
  "ssl-checker": { label: "SSL Denetleyici", description: "Herhangi bir alan adı için SSL/TLS sertifika detaylarını, zincirini ve geçerliliğini inceleyin" },
  "headers-inspector": { label: "Başlık Denetleyici", description: "HTTP yanıt başlıklarını inceleyin ve güvenlik başlık yapılandırmasını analiz edin" },

  // Security
  "password-generator": { label: "Parola Oluşturucu", description: "Güç analiziyle güvenli parolalar ve parola cümleleri oluşturun" },
  "encryption": { label: "Şifreleme", description: "Parola kullanarak AES-256-GCM ile metin şifreleyin ve şifre çözün" },
  "cert-decoder": { label: "Sertifika Çözücü", description: "X.509 PEM sertifikalarını ayrıştırın ve çözülmüş alan detaylarıyla inceleyin" },
  "totp": { label: "TOTP Oluşturucu", description: "Kimlik doğrulama uygulamaları için QR kodlu zamana dayalı tek kullanımlık parolalar oluşturun" },
  "csp-builder": { label: "CSP Oluşturucu", description: "Content-Security-Policy başlıklarını doğrulama uyarılarıyla görsel olarak oluşturun" },

  // Data Tools
  "csv-viewer": { label: "CSV Görüntüleyici", description: "CSV/TSV verilerini elektronik tablo benzeri arayüzde görüntüleyin, düzenleyin, sıralayın ve dışa aktarın" },
  "json-path": { label: "JSON Path", description: "JSON yapısını keşfedin, yolları bulun ve JSONPath ifadeleriyle sorgulayın" },
  "data-transformer": { label: "Veri Dönüştürücü", description: "JSON/CSV verilerini filtreleme, sıralama, eşleme, yeniden adlandırma ve tekilleştirme işlemleriyle dönüştürün" },
  "sql-playground": { label: "SQL Oyun Alanı", description: "Yüklenen CSV/JSON verileri üzerinde tarayıcı içi SQLite ile SQL sorguları çalıştırın" },
  "chart-builder": { label: "Grafik Oluşturucu", description: "CSV/JSON verilerini çubuk, çizgi, pasta, dağılım ve alan grafikleri olarak görselleştirin" },

  // Image Tools
  "image-resize": { label: "Görsel Boyutlandırma", description: "En-boy oranı kilidi, yüzde modu ve anında indirme ile görselleri yeniden boyutlandırın" },
  "image-crop": { label: "Görsel Kırpma", description: "Hazır en-boy oranları ve sürüklenebilir seçimle görselleri kırpın" },
  "image-compress": { label: "Görsel Sıkıştırma", description: "Ayarlanabilir kalite ve format dönüştürmeyle görselleri sıkıştırın" },
  "image-format": { label: "Format Dönüştürücü", description: "PNG, JPEG, WebP ve AVIF formatları arasında görsel dönüştürün" },
  "color-from-image": { label: "Renk Seçici", description: "Büyüteç ve HEX/RGB/HSL çıktısıyla herhangi bir görselden renk seçin" },
  "placeholder-image": { label: "Yer Tutucu", description: "Özel boyutlar, renkler ve metinle yer tutucu görseller oluşturun" },
  "image-to-base64": { label: "Görselden Base64'e", description: "Görselleri data URI, HTML ve CSS çıktısıyla base64 dizelerine dönüştürün" },
  "favicon": { label: "Favicon Oluşturucu", description: "Tek bir görselden HTML etiketleriyle tüm standart favicon boyutlarını oluşturun" },

  // Fun
  "wheel-of-fate": { label: "Kader Çarkı", description: "Seçenekler listesinden rastgele seçim yapmak için çarkı çevirin" },
  "coin-flip": { label: "Yazı Tura", description: "Tatmin edici bir 3D animasyonla yazı tura atın ve sonuç geçmişinizi takip edin" },
  "dice-roller": { label: "Zar Atma", description: "d4'ten d100'e zar tipleri, değiştiriciler ve atış geçmişiyle sanal zar atın" },
  "random-number": { label: "Rastgele Sayı", description: "Aralık kontrolü, toplu mod ve dağılım görünümüyle rastgele sayılar oluşturun" },
  "team-shuffler": { label: "Takım Karıştırıcı", description: "Tek tıkla isim listesini rastgele takımlara bölün" },
  "bracket": { label: "Turnuva Tablosu", description: "Etkileşimli kazanan seçimiyle tek eleme turnuva tabloları oluşturun" },
  "random-picker": { label: "Rastgele Seçici", description: "Dramatik kart çevirme efektiyle listeden rastgele öğe seçin" },
  "magic-8-ball": { label: "Sihirli 8 Top", description: "Sihirli 8 Top'a evet/hayır sorusu sorun ve cevabınız için sallayın" },
  "rock-paper-scissors": { label: "Taş Kağıt Makas", description: "Skor takibiyle bilgisayara karşı Taş Kağıt Makas oynayın" },
  "would-you-rather": { label: "Hangisini Tercih Edersin", description: "'Hangisini Tercih Edersin' ikilemlerinde oy verin ve sonuçları görün" },
  "decision-maker": { label: "Karar Verici", description: "En zor sorularınıza dramatik evet/hayır yanıtları alın" },

  // PDF Tools
  "jpg-to-pdf": { label: "JPG'den PDF'e", description: "JPEG görsellerini PDF sayfalarına dönüştürün" },
  "png-to-pdf": { label: "PNG'den PDF'e", description: "PNG görsellerini PDF sayfalarına dönüştürün" },
  "pdf-merge": { label: "PDF Birleştir", description: "Birden fazla PDF'i tek bir dosyada birleştirin" },
  "pdf-split": { label: "PDF Böl", description: "Sayfaları ayıklayın veya parçalara bölün" },
  "pdf-reorder": { label: "PDF Sırala", description: "Sayfaları sürükle bırak ile yeniden sıralayın" },
  "pdf-compress": { label: "PDF Sıkıştır", description: "PDF dosya boyutunu küçültün" },
  "pdf-watermark": { label: "PDF Filigran", description: "Metin veya görsel filigranlar ekleyin" },
  "docx-to-pdf": { label: "DOCX'ten PDF'e", description: "Word belgelerini PDF'e dönüştürün" },
  "pptx-to-pdf": { label: "PPTX'ten PDF'e", description: "PowerPoint sunumlarını PDF'e dönüştürün" },
  "xlsx-to-pdf": { label: "XLSX'ten PDF'e", description: "Excel elektronik tablolarını PDF'e dönüştürün" },
  "csv-to-pdf": { label: "CSV'den PDF'e", description: "CSV elektronik tablolarını PDF tablolarına dönüştürün" },
  "html-to-pdf": { label: "HTML'den PDF'e", description: "HTML sayfalarını PDF'e dönüştürün" },
  "markdown-to-pdf": { label: "Markdown'dan PDF'e", description: "Markdown belgelerini PDF'e dönüştürün" },
}

export function getToolLabel(tool: ToolEntry, locale: string): string {
  if (locale === "tr" && toolTranslationsTr[tool.id]) {
    return toolTranslationsTr[tool.id].label
  }
  return tool.label
}

export function getToolDescription(tool: ToolEntry, locale: string): string {
  if (locale === "tr" && toolTranslationsTr[tool.id]) {
    return toolTranslationsTr[tool.id].description
  }
  return tool.description
}
