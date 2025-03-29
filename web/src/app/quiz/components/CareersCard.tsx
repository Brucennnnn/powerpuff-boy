import Typography from "@web/components/ui/typography";
import Image from "next/image";
export function CareersCard({ job }: { job: string }) {
  const jobInfo = jobs[job];

  return (
    <div className="flex flex-col p-4 justify-center items-center w-96 h-fit bg-white rounded-lg">
      <Image
        alt={job}
        src={`https://www.garenaacademy.com/_nuxt/img/game_artist.bec71db.png`}
        width={200}
        height={200}
      />
      <Typography variant="h3" fontWeight="bold">
        {jobInfo.title}
      </Typography>
      <Typography variant="h5">{jobInfo.description}</Typography>
    </div>
  );
}

type JobInfo = {
  title: string;
  description: string;
  image: string;
};

const jobs: Record<string, JobInfo> = {
  Artist: {
    title: "ศิลปิน",
    description:
      "อาชีพของผู้ที่ทำหน้าที่ออกแบบและวาดภาพองค์ประกอบต่างๆ ในเกมให้เห็นเป็นภาพที่สวยงามสมจริงหรือตามจินตนาการ อาทิ ฉากหลัง วิวทิวทัศน์ วัตถุต่างๆ ไม่ว่าจะเป็นยานพาหนะ อาวุธ บ้านเรือน สัตว์ รวมทั้งตัวละครและเครื่องแต่งกาย ให้ปรากฏเป็นภาพตามเรื่องราวในเกม",
    image: "artist.png",
  },
};
