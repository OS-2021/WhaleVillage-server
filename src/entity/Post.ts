import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Post {

  @PrimaryGeneratedColumn()
  uid: number;

  @Column()
  contents: string;

  @Column()
  title: string;

  @Column()
  media: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: string;

}