import Typography from "@web/components/ui/typography";
import Image from "next/image";

export type Career = {
  id: number;
  job_title_th: string;
  job_title_en: string;
  short_desc: string;
  job_avatar: string;
  academy_link: string;
};

export function CareersCard(props: Career) {
  return (
    <div className="flex flex-col p-4 justify-center items-center w-96 h-fit bg-white rounded-lg">
      <Image
        alt={props.job_title_en}
        src={props.job_avatar}
        width={200}
        height={200}
      />
      <Typography variant="h3" fontWeight="bold">
        {props.job_title_en}
      </Typography>
      <Typography variant="h3" fontWeight="bold">
        {props.job_title_th}
      </Typography>
      <Typography variant="h5">{props.short_desc}</Typography>
    </div>
  );
}
