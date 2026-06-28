import type React from 'react';
import type { Metadata } from 'next';
import { DATA_RIGHTS_SLA_DAYS, MIN_AGE_YEARS } from '@tayfa/shared/constants';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
};

const EFFECTIVE = '28 Haziran 2026';

export default function KvkkPage(): React.JSX.Element {
  return (
    <>
      <h1>KVKK Aydınlatma Metni</h1>
      <p>
        <strong>Son güncelleme: {EFFECTIVE}.</strong> İşbu Aydınlatma Metni, 6698 sayılı Kişisel
        Verilerin Korunması Kanunu ("KVKK") kapsamında, Tayfa uygulaması ve web sitesi ("Hizmet")
        aracılığıyla işlenen kişisel verilerinize ilişkin olarak sizi bilgilendirmek amacıyla
        hazırlanmıştır. Tayfa, ortak ilgi alanları üzerinden gerçek hayatta küçük grup buluşmaları
        kurmaya yarayan bir sosyal uygulamadır; bir{' '}
        <strong>flört (arkadaşlık/eş bulma) uygulaması değildir</strong>. Hizmet'i kullanabilmek
        için en az {MIN_AGE_YEARS} yaşında olmanız gerekir.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        Kişisel verileriniz, veri sorumlusu sıfatıyla Tayfa tarafından KVKK'ya uygun olarak
        işlenmektedir. Talep ve sorularınız için Veri Koruma Sorumlumuza{' '}
        <a href="mailto:dpo@tayfa.app">dpo@tayfa.app</a> adresinden ulaşabilirsiniz.
      </p>

      <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
      <ul>
        <li>
          <strong>Kimlik ve hesap verileri:</strong> telefon numarası, görünen ad, doğum tarihi (
          {MIN_AGE_YEARS}+ yaş doğrulaması amacıyla; yaşınız hesaplanır ve doğum tarihiniz
          başkalarına gösterilmez).
        </li>
        <li>
          <strong>Profil verileri:</strong> biyografi, fotoğraflar, konuştuğunuz diller, mahalle
          bilgisi ve seçtiğiniz/içe aktardığınız ilgi alanları.
        </li>
        <li>
          <strong>Doğrulama verileri (biyometrik veri dâhil):</strong> kullanıcıların gerçek ve{' '}
          {MIN_AGE_YEARS} yaş üstü olduğunu doğrulamak için, kimlik doğrulama sağlayıcımız bir resmi
          kimlik belgesi ve canlı bir özçekim ("canlılık" kontrolü) işleyebilir. Canlılık kontrolü
          sırasında yapılan yüz geometrisi karşılaştırması{' '}
          <strong>özel nitelikli (biyometrik) kişisel veri</strong> (KVKK m.6) niteliğindedir ve
          yalnızca <strong>açık rızanıza</strong> dayanılarak işlenir. Tayfa olarak yalnızca
          başarılı/başarısız sonucunu ve bir sağlayıcı referansını alırız;{' '}
          <strong>kimlik belgenizi veya biyometrik şablonunuzu saklamayız</strong>.
        </li>
        <li>
          <strong>Konum verileri:</strong> keşif için yaklaşık (mahalle/şehir) konum; yalnızca
          etkinlik oluşturduğunuzda veya katıldığınızda kesin konum. Kesin konumunuz, aşağıda 4.
          bölümde açıklandığı şekilde dışında başka kullanıcılara gösterilmez.
        </li>
        <li>
          <strong>İşlem güvenliği ve cihaz verileri:</strong> Hizmet kullanımına ilişkin kayıtlar,
          cihaz tanımlayıcıları ve kötüye kullanım ile yasak ihlalini önlemek için kullanılan
          özetlenmiş (hash) cihaz parmak izi.
        </li>
        <li>
          <strong>İçerik:</strong> mesajlar, değerlendirmeler, şikâyetler ve oluşturduğunuz etkinlik
          bilgileri.
        </li>
        <li>
          <strong>Müşteri işlem verileri:</strong> abonelik durumu ve hak sahiplikleri (ödeme iş
          ortaklarımızca işlenir; tam kart numaranızı saklamayız).
        </li>
      </ul>

      <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
      <ul>
        <li>Hizmet'in sunulması (hesap, keşif, etkinlik, grup sohbeti);</li>
        <li>{MIN_AGE_YEARS}+ yaş ve kimlik doğrulaması;</li>
        <li>etkinliklere katılım için kesin konumun işlenmesi;</li>
        <li>güven ve güvenlik, dolandırıcılık ve kötüye kullanımın önlenmesi;</li>
        <li>ürün analitiği ve iyileştirme; ve</li>
        <li>izin verdiğiniz takdirde pazarlama iletişimi.</li>
      </ul>

      <h2>4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2>
      <p>Kişisel verileriniz KVKK m.5 ve m.6 uyarınca aşağıdaki sebeplere dayanılarak işlenir:</p>
      <ul>
        <li>
          <strong>Bir sözleşmenin kurulması veya ifası</strong> (Hizmet'in sunulması) (m.5/2-c);
        </li>
        <li>
          <strong>Hukuki yükümlülüğün yerine getirilmesi</strong> (yaş ve güvenlik gereklilikleri)
          (m.5/2-ç);
        </li>
        <li>
          <strong>Meşru menfaat</strong> (güvenlik, dolandırıcılık önleme) (m.5/2-f);
        </li>
        <li>
          <strong>Açık rıza</strong> (biyometrik doğrulama, kesin konum, pazarlama ve analitik)
          (m.5/1 ve özel nitelikli veriler için m.6/2).
        </li>
      </ul>
      <p>
        Her bir açık rıza (konum, pazarlama, bağlı hesaplar, biyometrik doğrulama){' '}
        <strong>ayrı ayrı</strong> alınır ve dilediğiniz zaman geri çekilebilir. Pazarlama veya
        analitik rızasının geri çekilmesi, Hizmet'in temel kullanımını engellemez.
      </p>

      <h2>5. Kesin Konumun Korunması</h2>
      <p>
        Konum gizliliği temel bir güvenlik taahhüdümüzdür. Diğer kullanıcılara konumunuz yalnızca
        mahalle düzeyinde, bulanıklaştırılmış bir alan olarak gösterilir; kesin koordinatlar
        paylaşılmaz. Bir etkinliğin kesin buluşma noktası, yalnızca ev sahibinin onayladığı
        katılımcılara ve etkinlik başlamadan kısa bir süre önce açılır. Bir kullanıcıyı
        engellerseniz, aranızdaki tüm konum paylaşımı, varlık ve görünürlük derhâl sona erer.
      </p>

      <h2>6. Kişisel Verilerin Aktarımı</h2>
      <p>
        Kişisel verileriniz, Hizmet'i sunmamıza yardımcı olan ve veri işleme sözleşmeleriyle bağlı
        veri işleyenlere aktarılabilir: bulut barındırma ve veritabanı (AB / Frankfurt bölgesi),
        kimlik ve canlılık doğrulama sağlayıcısı, abonelik/ödeme iş ortakları, içerik denetimi,
        analitik, hata izleme ve bildirim sağlayıcıları. Kişisel verilerinizi{' '}
        <strong>satmıyoruz</strong>.
      </p>

      <h2>7. Yurt Dışına Aktarım ve Veri Yerleşimi</h2>
      <p>
        Verileriniz Avrupa Birliği'nde (Frankfurt, Almanya) barındırılmaktadır. KVKK m.9 uyarınca,
        yurt dışına aktarım gerektiğinde, yeterli korumayı sağlamak için Kişisel Verileri Koruma
        Kurulu'nca öngörülen <strong>standart sözleşme</strong> (taahhütname) ve diğer uygun
        güvenceler temelinde ya da açık rızanıza dayanılarak aktarım gerçekleştirilir.
      </p>

      <h2>8. Saklama Süreleri</h2>
      <p>
        Kişisel verileriniz, işleme amaçları için gerekli olduğu süre boyunca saklanır: hesap
        verileri hesabınız aktif olduğu sürece; doğrulama sonuçları güvenlik ve hukuki uyum için
        kısa bir süre (kimlik/biyometrik kaynak materyali tarafımızca saklanmaz); güvenlik kayıtları
        ve denetim günlükleri hukuki taleplere karşı savunma için gereken süre boyunca tutulur.
        Hesabınızı sildiğinizde verileriniz, sınırlı yasal saklama istisnaları dışında silinir veya
        geri döndürülemez biçimde anonim hâle getirilir.
      </p>

      <h2>9. İlgili Kişinin Hakları (KVKK m.11)</h2>
      <p>KVKK'nın 11. maddesi uyarınca, veri sorumlusuna başvurarak şu haklara sahipsiniz:</p>
      <ul>
        <li>kişisel veri işlenip işlenmediğini öğrenme;</li>
        <li>işlenmişse buna ilişkin bilgi talep etme;</li>
        <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme;</li>
        <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme;</li>
        <li>eksik veya yanlış işlenmişse düzeltilmesini isteme;</li>
        <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme;</li>
        <li>düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme;</li>
        <li>
          münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme;
          ve
        </li>
        <li>
          kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.
        </li>
      </ul>
      <p>
        Taleplerinizi uygulama içinden (Ayarlar → Gizlilik) iletebilir veya{' '}
        <a href="mailto:dpo@tayfa.app">dpo@tayfa.app</a> adresine yazabilirsiniz. Başvurularınızı en
        geç {DATA_RIGHTS_SLA_DAYS} gün içinde sonuçlandırırız. Ayrıca{' '}
        <strong>Kişisel Verileri Koruma Kurulu</strong>'na şikâyette bulunma hakkınız saklıdır.
      </p>

      <h2>10. VERBİS</h2>
      <p>
        Veri sorumlusu olarak, Veri Sorumluları Sicil Bilgi Sistemi'ne (<strong>VERBİS</strong>)
        ilişkin yükümlülüklerimizi, kayıt zorunluluğunun kapsamımıza girmesi hâlinde yerine
        getiririz ve sicil kaydımızı güncel tutarız.
      </p>

      <h2>11. Değişiklikler</h2>
      <p>
        İşbu Aydınlatma Metni'nde yapılan önemli değişiklikler uygulama içinde size bildirilecek ve
        yukarıdaki "son güncelleme" tarihi güncellenecektir.
      </p>
    </>
  );
}
