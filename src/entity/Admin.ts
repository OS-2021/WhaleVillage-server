import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Admin {

  @PrimaryGeneratedColumn()
  uid: number;

  @Column()
  id: string;

  @Column()
  password: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: string;
  
}