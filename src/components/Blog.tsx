import { getCollection, type CollectionEntry } from "astro:content";
import { Fragment } from "react";

type BlogCardProps = {
  href: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  banner?: any;
};

const BlogCard = ({
  title,
  description,
  date,
  tags,
  href,
  banner,
}: BlogCardProps) => {
  console.log(tags);

  return (
    <Fragment>
      <a
        href={href}
        className="w-[clamp(200px,24vw,100%)] h-[clamp(200px,24vh,20rem)] 
        hover:[&_>div]:h-full 
        hover:[&_>div]:rounded-[12px]
        hover:[&_div_>h2]:text-3xl 
        hover:[&_div_>div]:bottom-2
        hover:[&_div_>p]:text-wrap
        [&_*]:transition-all 
        [&>*]:pointer-events-none
        relative  mb-4 rounded-[12px] bg-cover bg-center flex justify-center items-center"
        style={{ background: `url(${banner})` }}
      >
        <div className="hover:[&>div]:bg-amber-20 transition-height transform-border ease-in-out text-clip duration-300 absolute mix-blend-overlay p-2 flex flex-col items-start  rounded-b-[12px] left-0 bottom-0 w-full h-[clamp(80px,8vh,8rem)] backdrop-blur-2xl">
          <div className=" p-2 absolute z-[3] left-0 bottom-[clamp(70px,7vh,7rem)] translate-y-3 text-[1.1rem] font-semibold  text-white font-serif [text-shadow:0_0_5px_rgba(0,0,0,0.8)]  mix-blend-overlay">
            {new Date(date).toLocaleDateString()}
          </div>
          <div className="flex justify-between w-full items-center mb-2">
            <h2 className="transition-all text-2xl   text-white  font-extrabold [text-shadow:0_0_5px_rgba(0,0,0,0.8)]">
              {title}
            </h2>
            <div className="flex gap-0.5">
              {tags &&
                tags.map((tag) => {
                  return (
                    <span className="p-1 font-thin  bg-black  rounded-full ">
                      {tag}
                    </span>
                  );
                })}
            </div>
          </div>
          <p className="text-white font-light mix-blend-difference text-nowrap text-ellipsis h-full w-full overflow-hidden">
            {description}
          </p>
        </div>
      </a>
    </Fragment>
  );
};

const blogs = (await getCollection("blog")).sort(
  (a, b) =>
    new Date(b.data.dateCreated).getTime() -
    new Date(a.data.dateCreated).getTime()
);

const BlogList = () => {
  return (
    <div className="center-list flex flex-col  overflow-scroll justify-center items-center p-4 ">
      {blogs.map((blog) => {
        return (
          <BlogCard
            key={blog.id}
            title={blog.data.title}
            description={blog.data.description || ""}
            date={blog.data.dateCreated.toISOString()}
            tags={blog.data.tags}
            href={`/blog/${blog.id}`}
            banner={blog.data.banner}
          />
        );
      })}
    </div>
  );
};

export default BlogList;
