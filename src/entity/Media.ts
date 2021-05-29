import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Media {

  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column()
  path: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: string;
}