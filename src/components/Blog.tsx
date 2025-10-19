import { getCollection, type CollectionEntry } from "astro:content";
import { Fragment } from "react";

type BlogCardProps = {
  title: string;
  description: string;
  date: string;
  tags?: string[];
};

const BlogCard = ({ title, description, date, tags }: BlogCardProps) => {
  return <a href=""></a>;
};

const blogs = (await getCollection("blog")).sort(
  (a, b) =>
    new Date(b.data.dateCreated).getTime() -
    new Date(a.data.dateCreated).getTime()
);

const BlogList = () => {
  return (
    <div className="flex flex-col space-y-4">
      <Fragment>
        {blogs.map((blog) => {
          return (
            <BlogCard
              key={blog.id}
              title={blog.data.title}
              description={blog.data.description || ""}
              date={blog.data.dateCreated.toISOString()}
              tags={blog.data.tags}
            />
          );
        })}
      </Fragment>
    </div>
  );
};

export default BlogList;
