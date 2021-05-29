import { getConnection } from "typeorm";
import { Admin } from '../entity/Admin';


export const checkAdmin = (async (uid) => {
  let output;

  const admin = await getConnection()
  .createQueryBuilder()
  .select("admin")
  .from(Admin, "admin")
  .where("admin.uid = :uid", { uid: uid })
  .orWhere("user.id = :id", { id: uid })
  .getOne();
  
  if (admin !== undefined) {
    output = [true, admin];
  }else{
    output = [false,undefined];
  }

  return output;
});
