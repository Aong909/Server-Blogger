const errors = require("../util/errors");
const pool = require("../db/dbConnect");
const enCode = require("../util/enCode");

//function get timestamp
function getSqlTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);
  const seconds = ("0" + date.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

//user
exports.GetAllUser = async (req, res, next) => {
  try {
    let sql = `SELECT user_id, user_name, first_name, last_name, email, user_role, created_at
              FROM public."Users" WHERE "Users".user_role = 'user';`;

    const response = await pool.query(sql);
    if (response.rowCount === 0) {
      return errors.MappingError(next, 500, "Internal server Error");
    }
    return res.status(200).json({ status: "success", data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Internal server errors");
  }
};

exports.getUserByID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Argument not found");
    }

    // let sql = `SELECT "Users".USER_ID,
    //             "Users".USER_NAME,
    //             "Users".FIRST_NAME,
    //             "Users".LAST_NAME,
    //             "Users".CREATED_AT,
    //             "Users".EMAIL,
    //             COUNT(*)  AS FOLLOWING,

    //             (SELECT COUNT(*)
    //             	FROM PUBLIC."Follows"
    //             	WHERE FOLLOWEE_ID = $1) AS FOLLOWER
    //           FROM PUBLIC."Follows"
    //           LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Follows".FOLLOW_ID
    //           WHERE FOLLOW_ID = $1
    //           GROUP BY FOLLOW_ID,
    //             "Users".USER_ID;`;
    const sql = `SELECT "Users".USER_ID,
	              "Users".USER_NAME,
	              "Users".FIRST_NAME,
	              "Users".LAST_NAME,
	              "Users".CREATED_AT,
	              "Users".EMAIL
	              from "Users"
	              where user_id = $1`;

    const response = await pool.query(sql, [id]);

    if ((await response).rowCount === 0) {
      return errors.MappingError(next, 401, "data not found");
    }
    const following = await pool.query(
      'SELECT * FROM "Follows" WHERE follow_id = $1',
      [id]
    );
    const follower = await pool.query(
      'SELECT * FROM "Follows" WHERE followee_id = $1',
      [id]
    );
    // date for return to front
    const data = {
      ...response.rows[0],
      following: following.rowCount,
      follower: follower.rowCount,
    };
    return res.status(200).json({ status: "success", data: data });
  } catch (error) {
    return errors.MappingError(next, 500, "Internal server error");
  }
};

exports.updateUserByID = async (req, res, next) => {
  try {
    let { userName, firstName, lastName, email } = req.body;
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Argument not found");
    }

    let sql = `UPDATE public."Users"
	             SET user_name=$2, first_name=$3, last_name=$4, email=$5
	             WHERE user_id = $1;`;

    const response = await pool.query(sql, [
      id,
      userName,
      firstName,
      lastName,
      email,
    ]);
    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Update success" });
    }
  } catch (err) {
    console.log(err.message);
    // error duplicate column user
    if (err.message.split(" ")[6] === `"users_username_key"`) {
      errors.MappingError(next, 404, "Username is duplicate");
    } else if (err.message.split(" ")[6] === `"users_email_key"`) {
      errors.MappingError(next, 404, "Email is duplicate");
    }
    //error everything
    else {
      errors.MappingError(next, 400, "Internal server error");
    }
  }
};

exports.SignUp = async (req, res, next) => {
  try {
    let { userName, firstName, lastName, email, userPassword } = req.body;
    const hashPassword = await enCode.hashPassword(userPassword);

    let sql = `INSERT INTO public."Users"(
            user_name, first_name, last_name, email, user_password,created_at)
           VALUES ($1, $2, $3, $4, $5,$6);`;
    const sqlTimestamp = getSqlTimestamp();

    const response = await pool.query(sql, [
      userName,
      firstName,
      lastName,
      email,
      hashPassword,
      sqlTimestamp,
    ]);

    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Welcome to Blogger" });
    }
  } catch (error) {
    console.log(error);
    if (error.message.split(" ")[6] === '"users_username_key"') {
      return errors.MappingError(next, 404, "Username is duplicate");
    } else if (error.message.split(" ")[6] === '"users_email_key"') {
      return errors.MappingError(next, 404, "Email is duplicate");
    }
    return errors.MappingError(next, 500, "Internal server error");
  }
};

exports.LogIn = async (req, res, next) => {
  try {
    const { userName, userPassword } = req.body;

    const user = await pool.query(
      `SELECT user_id, user_name, first_name, last_name, email, user_password, user_role, created_at
	    FROM public."Users" WHERE user_name = $1;`,
      [userName]
    );

    if (!user.rowCount) {
      return errors.MappingError(next, 401, "User not found");
    }

    const comperePassword = await enCode.comperePassword(
      userPassword,
      user.rows[0].user_password
    );

    const token = await enCode.genToken({
      id: user.rows[0].user_id,
      role: user.rows[0].user_role,
    });

    delete user.rows[0].user_password;

    if (!comperePassword) {
      return errors.MappingError(next, 401, "Oops,wrong password");
    } else {
      return res
        .status(200)
        .cookie("token", token, {
          maxAge: 1000 * 60 * 60 * 24,
          sameSite: "None",
          secure: true,
          httpOnly: true,
          path: "/",
        })
        .json({ status: "success", data: user.rows[0] });
    }
  } catch (err) {
    console.log(err);
    errors.MappingError(next, 500, "Internal server error");
  }
};

//content
exports.saveContent = async (req, res, next) => {
  try {
    const { user_id, content, categories } = req.body;

    //check duplicate content
    const checkContent = await pool.query(
      `SELECT blog_id FROM public."Blogs"
        WHERE cast(blog_content AS TEXT) LIKE $1`,
      [JSON.stringify(content)]
    );

    if (checkContent.rowCount !== 0) {
      return errors.MappingError(next, 401, "Content duplicate");
    } else {
      const sqlTimestamp = getSqlTimestamp();
      //save content
      await pool.query(
        `INSERT INTO public."Blogs"(
                  blog_content, user_id,created_at,updated_at)
                  VALUES ($1, $2,$3,$3);`,
        [JSON.stringify(content), user_id, sqlTimestamp]
      );
      //get content_id
      const contents = await pool.query(
        `SELECT blog_id FROM public."Blogs"
          WHERE cast(blog_content AS TEXT) LIKE $1`,
        [JSON.stringify(content)]
      );

      for (const element of categories) {
        //check duplicate category
        const checkCategory = await pool.query(
          `SELECT * FROM public."Categories"
                    WHERE category_name = $1;`,
          [String(element).toLowerCase()]
        );

        if (checkCategory.rowCount === 0) {
          //save category
          await pool.query(
            `INSERT INTO public."Categories"(category_name)
            VALUES($1)`,
            [String(element).toLowerCase()]
          );
        }
        //get category id
        const category = await pool.query(
          `SELECT * FROM public."Categories"
                    WHERE category_name = $1;`,
          [String(element).toLowerCase()]
        );
        //save content category
        await pool.query(
          `INSERT INTO public."Blog_Category"(
	                        blog_id, category_id)
	                        VALUES ($1,$2);`,
          [contents.rows[0].blog_id, category.rows[0].category_id]
        );
      }
      return res
        .status(200)
        .json({ status: "success", data: "save content success" });
    }
  } catch (error) {
    console.log(error);
    return errors.MappingError(next, 500, "Internal server error");
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const { blog_id, content, categories } = req.body;

    const sqlTimestamp = getSqlTimestamp();
    const updateContent = `UPDATE PUBLIC."Blogs"
                          SET BLOG_CONTENT = $1,
                          	UPDATED_AT = $3
                          WHERE BLOG_ID = $2;`;
    //update content and timestamp
    const response = await pool.query(updateContent, [
      JSON.stringify(content),
      blog_id,
      sqlTimestamp,
    ]);

    //delete all category of blog
    await pool.query(
      `DELETE FROM public."Blog_Category"
	                    WHERE blog_id = $1;`,
      [blog_id]
    );

    for (const element of categories) {
      //check duplicate category
      const checkCategory = await pool.query(
        `SELECT * FROM public."Categories"
                  WHERE category_name = $1;`,
        [String(element).toLowerCase()]
      );

      if (checkCategory.rowCount === 0) {
        //save category
        await pool.query(
          `INSERT INTO public."Categories"(category_name)
          VALUES($1)`,
          [String(element).toLowerCase()]
        );
      }

      //get category id
      const category = await pool.query(
        `SELECT * FROM public."Categories"
                  WHERE category_name = $1;`,
        [String(element).toLowerCase()]
      );
      //save content category
      await pool.query(
        `INSERT INTO public."Blog_Category"(
                        blog_id, category_id)
                        VALUES ($1,$2);`,
        [blog_id, category.rows[0].category_id]
      );
    }

    return res.status(200).json({ status: "success", data: "Update success" });
  } catch (error) {
    console.log(error);
    return errors.MappingError(next, 500, "Internal server error");
  }
};

exports.getAllContent = async (req, res, next) => {
  try {
    let sql = `SELECT "Blogs".BLOG_ID,
	                BLOG_CONTENT,
	                PUBLIC."Blogs".CREATED_AT,
	                PUBLIC."Blogs".UPDATED_AT,
	                PUBLIC."Blogs".USER_ID,
	                PUBLIC."Users".USER_NAME,
                  PUBLIC."Users".FIRST_NAME,
	                PUBLIC."Users".LAST_NAME,
	                COUNT(DISTINCT "Likes".user_id) AS TOTAL_LIKE,
	                COUNT(DISTINCT "Comments".ID) AS TOTAL_COMMENT,
					        ARRAY_AGG(DISTINCT "Categories".category_name) AS categories
                FROM PUBLIC."Blogs"
                LEFT JOIN PUBLIC."Likes" ON "Likes".BLOG_ID = "Blogs".BLOG_ID
                LEFT JOIN PUBLIC."Comments" ON "Comments".BLOG_ID = "Blogs".BLOG_ID
                LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Blogs".USER_ID
				        LEFT JOIN public."Blog_Category" ON "Blog_Category".blog_id = "Blogs".blog_id
				        LEFT JOIN public."Categories" ON "Categories".category_id = "Blog_Category".category_id
                WHERE "Blogs".status_display = TRUE
                GROUP BY "Blogs".BLOG_ID,
	                "Users".USER_ID 
                ORDER BY TOTAL_LIKE DESC
                  ;`;

    const response = await pool.query(sql);

    if (response.rowCount === 0) {
      return errors.MappingError(next, 500, "Internal server Error");
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {
    console.log(error);
    return errors.MappingError(next, 500, "Internal server Error");
  }
};

exports.getContentByUserID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Argument not found");
    }

    let sql = `SELECT "Blogs".BLOG_ID,
	                BLOG_CONTENT,
	                PUBLIC."Blogs".CREATED_AT,
	                PUBLIC."Blogs".UPDATED_AT,
	                PUBLIC."Blogs".USER_ID,
	                PUBLIC."Users".USER_NAME,
                  PUBLIC."Users".FIRST_NAME,
	                PUBLIC."Users".LAST_NAME,
	                COUNT(DISTINCT "Likes".user_id) AS TOTAL_LIKE,
	                COUNT(DISTINCT "Comments".ID) AS TOTAL_COMMENT,
					        ARRAY_AGG(DISTINCT "Categories".category_name) AS categories
                FROM PUBLIC."Blogs"
                LEFT JOIN PUBLIC."Likes" ON "Likes".BLOG_ID = "Blogs".BLOG_ID
                LEFT JOIN PUBLIC."Comments" ON "Comments".BLOG_ID = "Blogs".BLOG_ID
                LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Blogs".USER_ID
				        LEFT JOIN public."Blog_Category" ON "Blog_Category".blog_id = "Blogs".blog_id
				        LEFT JOIN public."Categories" ON "Categories".category_id = "Blog_Category".category_id
                WHERE "Users".user_id = $1
                  AND "Blogs".STATUS_DISPLAY = TRUE
                GROUP BY "Blogs".BLOG_ID,
	                "Users".USER_ID 
                ORDER BY "Blogs".created_at DESC;`;

    const response = await pool.query(sql, [id]);

    return res.status(200).json({ status: "Success", data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Internal server errors");
  }
};

exports.getContentByBlogID = async (req, res, next) => {
  try {
    let { id: blog_id } = req.params;
    let { user_id } = req.query;
    blog_id = Number(blog_id);
    console.log("blog_id", blog_id, "user_id", user_id);

    if (!blog_id) {
      return errors.MappingError(next, 401, "Argument not found");
    }

    let sql = `SELECT "Blogs".blog_id,
	              BLOG_CONTENT,
	              PUBLIC."Blogs".CREATED_AT,
	              PUBLIC."Blogs".UPDATED_AT,
	              PUBLIC."Blogs".USER_ID,
	              PUBLIC."Users".USER_NAME,
	              PUBLIC."Users".FIRST_NAME,
	              PUBLIC."Users".LAST_NAME,
	              COUNT(DISTINCT "Likes".USER_ID) AS TOTAL_LIKE,
	              COUNT(DISTINCT "Comments".ID) AS TOTAL_COMMENT,
	              ARRAY_AGG(DISTINCT "Categories".CATEGORY_NAME) AS CATEGORIES
              FROM PUBLIC."Blogs"
              LEFT JOIN PUBLIC."Likes" ON "Likes".BLOG_ID = "Blogs".BLOG_ID
              LEFT JOIN PUBLIC."Comments" ON "Comments".BLOG_ID = "Blogs".BLOG_ID
              LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Blogs".USER_ID
              LEFT JOIN PUBLIC."Blog_Category" ON "Blog_Category".BLOG_ID = "Blogs".BLOG_ID
              LEFT JOIN PUBLIC."Categories" ON "Categories".CATEGORY_ID = "Blog_Category".CATEGORY_ID
              WHERE "Blogs".BLOG_ID = $1
              GROUP BY "Blogs".BLOG_ID,
	              "Users".USER_ID
              ORDER BY PUBLIC."Blogs".CREATED_AT DESC;`;

    const response = await pool.query(sql, [blog_id]);
    let bookmark = await pool.query(
      `SELECT USER_ID,
	       BLOG_ID
      FROM "Bookmarks"
      WHERE BLOG_ID = $1
	      AND USER_ID = $2;`,
      [blog_id, user_id]
    );

    bookmark = Boolean(bookmark.rowCount);

    let favorite = await pool.query(
      `SELECT USER_ID,
	      BLOG_ID
      FROM "Likes"
      WHERE BLOG_ID = $1
	      AND USER_ID = $2;`,
      [blog_id, user_id]
    );
    favorite = Boolean(favorite.rowCount);
    console.log("Like Bookmark", favorite, bookmark);

    if (response.rowCount === 0) {
      return errors.MappingError(next, 401, "Data not found");
    }
    return res.status(200).json({
      status: "Success",
      data: { ...response.rows[0], bookmark, favorite },
    });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Internal server errors");
  }
};

exports.deleteContentByBlogID = async (req, res, next) => {
  try {
    const { id: blog_id } = req.params;

    const sql = `UPDATE public."Blogs"
	          SET status_display=false
	          WHERE blog_id = $1`;
    const response = await pool.query(sql, [blog_id]);
    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Delete success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

//category
exports.getAllCategory = async (req, res, next) => {
  try {
    const sql = `SELECT PUBLIC."Categories".CATEGORY_ID,
	                PUBLIC."Categories".CATEGORY_NAME,
	                COUNT("Blog_Category".BLOG_ID) AS TOTAL
                FROM PUBLIC."Categories"
                LEFT JOIN PUBLIC."Blog_Category" ON "Blog_Category".CATEGORY_ID = "Categories".CATEGORY_ID
                GROUP BY "Categories".CATEGORY_ID
                ORDER BY "total" DESC;`;

    const response = await pool.query(sql);
    if (response.rowCount === 0) {
      return errors.MappingError(next, 500, "Internal server errors");
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {}
};

exports.getTopCategory = async (req, res, next) => {
  try {
    let { limit } = req.params;
    limit = Number(limit);
    const sql = `SELECT PUBLIC."Categories".CATEGORY_ID,
	                PUBLIC."Categories".CATEGORY_NAME,
	                COUNT("Blog_Category".BLOG_ID) AS TOTAL
                FROM PUBLIC."Categories"
                LEFT JOIN PUBLIC."Blog_Category" ON "Blog_Category".CATEGORY_ID = "Categories".CATEGORY_ID
                GROUP BY "Categories".CATEGORY_ID
                ORDER BY "total" DESC
                LIMIT $1;`;

    const response = await pool.query(sql, [limit]);
    if (response.rowCount === 0) {
      return errors.MappingError(next, 500, "Internal server errors");
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {}
};

//follow
exports.follow = async (req, res, next) => {
  try {
    console.log(req.body);
    const { user_id, follow_id } = req.body;
    const sqlTimestamp = getSqlTimestamp();

    const sql = `INSERT INTO public."Follows"(
	                follow_id, followee_id,created_at)
	              VALUES ($1, $2,$3);`;

    const response = await pool.query(sql, [user_id, follow_id, sqlTimestamp]);

    if (response.rows !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Follow success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.getFollowByID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Argument not found");
    }
    const sql = `SELECT "Follows".FOLLOW_ID AS user_id,
                  "Follows".FOLLOWEE_ID AS following_id,
                  "Users".USER_NAME,
                  "Users".FIRST_NAME,
                  "Users".LAST_NAME
                FROM PUBLIC."Follows"
                LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Follows".FOLLOWEE_ID
                WHERE "Follows".FOLLOW_ID = $1
                ORDER BY "Follows".FOLLOW_ID,
                  "Follows".FOLLOWEE_ID;`;

    const response = await pool.query(sql, [id]);
    if (response.rowCount === 0) {
      return res.status(200).json({ status: "Success", data: [] });
    }
    return res.status(200).json({ status: "Success", data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Internal server errors");
  }
};

exports.getTopFollow = async (req, res, next) => {
  try {
    let { limit } = req.query;
    limit = Number(limit);

    if (!limit) {
      return errors.MappingError(next, 401, "Argument not found");
    }
    const sql = `SELECT "Users".USER_ID AS following_id,
	                "Users".USER_NAME,
	                "Users".FIRST_NAME,
	                "Users".LAST_NAME,
	                COUNT(*) AS FOLLOWER
                FROM PUBLIC."Follows"
                LEFT JOIN PUBLIC."Users" ON "Users".USER_ID = "Follows".FOLLOWEE_ID
                GROUP BY "Users".USER_ID
                ORDER BY FOLLOWER DESC
                LIMIT $1;`;
    const response = await pool.query(sql, [limit]);
    if (response.rowCount === 0) {
      return errors.MappingError(next, 401, "Data not found");
    }
    return res.status(200).json({ status: "Success", data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Internal server errors");
  }
};

exports.unFollow = async (req, res, next) => {
  try {
    const { user_id, follow_id } = req.body;

    const sql = `DELETE FROM public."Follows"
                WHERE follow_id = $1 AND followee_id = $2;`;

    const response = await pool.query(sql, [user_id, follow_id]);
    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "unFollow success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

//bookmark
exports.postBookmark = async (req, res, next) => {
  try {
    const { user_id, blog_id } = req.body;
    const sqlTimestamp = getSqlTimestamp();

    sql = `INSERT INTO public."Bookmarks"(
      user_id, blog_id,created_at)
      VALUES ($1, $2,$3);`;

    const response = await pool.query(sql, [user_id, blog_id, sqlTimestamp]);

    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Bookmark success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.getBookmarkByID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Data not found");
    }
    // const sql = ` SELECT id, "Bookmarks".user_id, "Bookmarks".blog_id, "Bookmarks".created_at
    //               FROM PUBLIC."Bookmarks"
    //               LEFT JOIN PUBLIC."Blogs" ON "Blogs".BLOG_ID = "Bookmarks".BLOG_ID
    //               WHERE "Bookmarks".USER_ID = $1
    //               ORDER BY "Bookmarks".USER_ID,
    //                 "Bookmarks".BLOG_ID;`;
    const sql = `SELECT blog_id
                FROM public."Bookmarks"
                WHERE user_id = $1`;
    const response = await pool.query(sql, [id]);
    if (response.rowCount === 0) {
      return res.status(200).json({ data: [] });
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.deleteBookmark = async (req, res, next) => {
  try {
    const { user_id, blog_id } = req.body;

    const sql = `DELETE FROM public."Bookmarks"
	              WHERE user_id = $1 AND blog_id = $2;`;

    const response = await pool.query(sql, [user_id, blog_id]);
    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "UnBookmark success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

//like
exports.postLike = async (req, res, next) => {
  try {
    const { user_id, blog_id } = req.body;
    const sqlTimestamp = getSqlTimestamp();

    sql = `INSERT INTO public."Likes"(
          user_id, blog_id,created_at)
          VALUES ($1, $2,$3);`;

    const response = await pool.query(sql, [user_id, blog_id, sqlTimestamp]);

    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Favorite success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.getLikeByID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Data not found");
    }
    const sql = ` SELECT  blog_id
	                FROM public."Likes"
	                WHERE user_id = $1`;
    const response = await pool.query(sql, [id]);
    if (response.rowCount === 0) {
      return res.status(200).json({ data: [] });
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.deleteLike = async (req, res, next) => {
  try {
    const { user_id, blog_id } = req.body;

    const sql = `DELETE FROM public."Likes"
	              WHERE user_id = $1 AND blog_id = $2;`;

    const response = await pool.query(sql, [user_id, blog_id]);
    if (response.rowCount !== 0) {
      return res
        .status(200)
        .json({ status: "success", data: "Unfavorite success" });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

//comment
exports.getCommentByID = async (req, res, next) => {
  try {
    let { id } = req.params;
    id = Number(id);

    if (!id) {
      return errors.MappingError(next, 401, "Data not found");
    }

    let sql = `SELECT ID,
	              CONTENT,
	              "Comments".USER_ID,
	              "Users".FIRST_NAME,
	              "Users".LAST_NAME,
	              "Users".USER_NAME,
	              BLOG_ID,
	              PARENT,
	              "Comments".CREATED_AT
              FROM PUBLIC."Comments"
              LEFT JOIN "Users" ON "Users".USER_ID = "Comments".USER_ID
              WHERE BLOG_ID = $1
              ORDER BY "Comments".CREATED_AT DESC;`;

    const response = await pool.query(sql, [id]);

    if (response.rowCount === 0) {
      return res.status(200).json({ data: [] });
    }
    return res.status(200).json({ data: response.rows });
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};

exports.postComment = async (req, res, next) => {
  try {
    const { user_id, blog_id, content } = req.body;

    if (!content || !blog_id || !user_id) {
      return errors.MappingError(next, 401, "Argument dot found");
    }
    const sqlTimestamp = getSqlTimestamp();

    const sql = `INSERT INTO public."Comments"(
	                content, user_id, blog_id,created_at)
	                VALUES ($1, $2, $3,$4);`;
    const response = await pool.query(sql, [
      content,
      user_id,
      blog_id,
      sqlTimestamp,
    ]);
    if (response.rowCount) {
      const sql_data = ` SELECT ID,
	                        CONTENT,
	                        "Comments".USER_ID,
	                        "Users".FIRST_NAME,
	                        "Users".LAST_NAME,
	                        "Users".USER_NAME,
	                        BLOG_ID,
	                        PARENT,
	                        "Comments".CREATED_AT
                        FROM PUBLIC."Comments"
                        LEFT JOIN "Users" ON "Users".USER_ID = "Comments".USER_ID
                        ORDER BY ID DESC
                        LIMIT 1 ;`;
      const data = await pool.query(sql_data);
      return res.status(200).json({ status: "success", data: data.rows[0] });
    }
  } catch (error) {
    console.log(error.message);
    return errors.MappingError(next, 500, "Inter server error");
  }
};
