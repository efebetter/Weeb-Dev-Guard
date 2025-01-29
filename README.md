# ✨Weeb Dev Discord Guard Bot ✨

🤖 **Discord.js v14 ile geliştirilmiş, sunucunuz için güvenlik sistemleri sağlayan gelişmiş bir bot!** 🤖  

---  

## 📋 İçerik Tablosu  
- [🔧 Gereksinimler](#gereksinimler)  
- [🚀 Başlarken](#başlarken)  
- [🛆 Kurulum](#kurulum)  
- [🛠️ Komutlar](#komutlar)  
- [👤 Yazar](#yazar)  
- [📄 Lisans](#lisans)  

---  

## 🔧 Gereksinimler  
- [Node.js](https://nodejs.org/en/)  

---  

## 🚀 Başlarken  
Yerel makinenizde gerekli tüm araçların kurulu olduğundan emin olun ve ardından aşağıdaki adımları izleyin.  

## 🛆 Kurulum  

### 📂 Adım 1: Repoyu Klonla  

```bash  
git clone https://github.com/oktayyavuz/Weeb-Dev-Guard  
cd Weeb-Dev-Guard/  
```  

### 🛆 Adım 2: Bağımlılıkları Yükle  

```bash  
npm install
```  

### ⚙️ Adım 3: Yapılandırma  
1. `config.json` dosyasını açın.  
2. Discord API tokeninizi doldurun:  

```json  
{
    "token": "TOKENİNİZİ GİRİN",
    "durum": "Arka bahçenden seni",
    "limit": { //Limitler//
        "delete_channels": 3,
        "create_roles": 4,
        "delete_roles": 4,
        "send_everyone": 3,
        "create_channels": 5,
        "ban_members": 4,
        "kick_members": 5
      }
}
```  

### 🚀 Adım 4: Botu Başlat  

```bash  
node index.js  
```  

veya  

```bash  
npm run start  
```  

---  

## 🛠️ Komutlar  

| Komut   | Açıklama                                     |  
|---------|---------------------------------------------|  
| `guard-aç` | Sunucu koruma sistemlerini aktifleştirir.    |  
| `guard-kapat` | Sunucu koruma sistemlerini devre dışı bırakır.    |  
| `güvenli` | Güvenli rol veya kullanıcı ayarlamanızı sağlar.    |  
| `güvenli-liste` | Güvenli listeyi görüntüler.    |  
| `güvenli-listeden-sil` | Güvenli listeden kişileri veya rolleri çıkarır.    |  
| `af` | Belirli bir kullanıcının limit verilerini sıfırlar.    |  

---  

## 👤 Yazar  
[Oktay Yavuz](https://oktaydev.com.tr/)  

---  

## 📄 Lisans  
Bu proje MIT Lisansı kapsamında lisanslanmıştır - ayrıntılar için [LICENSE.md](LICENSE) dosyasına bakın.  

---  

### Notlar:  
- Daha fazla bilgi için proje dökümanlarını kontrol edin.  
- Sorularınız için [Destek Sunucusu](https://discord.gg/dvCKjxHn35) adresine katılabilirsiniz.

